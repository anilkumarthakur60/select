import type { OptionAccessor } from '@/types/option'
import type { NormalizedTreeNode, TreeOptionLike } from '@/types/tree-node'
import { readAccessor } from '@/core/accessor'

interface NormalizeTreeConfig<T> {
  optionValue?: OptionAccessor<T, unknown>
  optionLabel?: OptionAccessor<T, string>
  optionChildren?: OptionAccessor<T, T[] | undefined>
  optionDisabled?: OptionAccessor<T, boolean>
}

/**
 * Walks the user-supplied tree and produces a normalised mirror with depth,
 * parent links, and stable ids attached to every node. The output preserves
 * the input's structure (branches and leaves stay where they are) so the
 * renderer can recurse over `children` without having to look anything up.
 */
export function normalizeTree<T extends TreeOptionLike>(
  options: readonly T[],
  config: NormalizeTreeConfig<T>,
): NormalizedTreeNode<T>[] {
  function visit(
    node: T,
    depth: number,
    parentId: string | null,
    indexPath: string,
  ): NormalizedTreeNode<T> {
    const value = readAccessor(
      node,
      config.optionValue,
      (node as Record<string, unknown>).value ?? (node as Record<string, unknown>).id,
    )
    const label = readAccessor(
      node,
      config.optionLabel,
      String(
        (node as Record<string, unknown>).label ??
          (node as Record<string, unknown>).name ??
          value ??
          '',
      ),
    )
    const childrenRaw =
      readAccessor(node, config.optionChildren, undefined as T[] | undefined) ??
      ((node as Record<string, unknown>).children as T[] | undefined) ??
      []
    const disabled = readAccessor(
      node,
      config.optionDisabled,
      Boolean((node as Record<string, unknown>).disabled),
    )

    const id = `tnode-${indexPath}-${String(value)}`
    const children: NormalizedTreeNode<T>[] = []
    childrenRaw.forEach((child, i) => {
      children.push(visit(child, depth + 1, id, `${indexPath}.${i}`))
    })

    return {
      id,
      value,
      label: String(label),
      depth,
      parentId,
      isLeaf: children.length === 0,
      disabled: Boolean(disabled),
      children,
      raw: node,
    }
  }

  return options.map((option, index) => visit(option, 0, null, String(index)))
}

/**
 * Depth-first walk. Visits every node; the callback can short-circuit by
 * returning `false` (stops descending into that branch).
 */
export function walkTree<T>(
  nodes: readonly NormalizedTreeNode<T>[],
  visit: (node: NormalizedTreeNode<T>) => boolean | void,
): void {
  for (const node of nodes) {
    if (visit(node) === false) continue
    if (node.children.length > 0) walkTree(node.children, visit)
  }
}

/**
 * Flattens the tree to a single array of nodes in depth-first order. Useful
 * for keyboard-nav and search indexing where order matters.
 */
export function flattenTree<T>(nodes: readonly NormalizedTreeNode<T>[]): NormalizedTreeNode<T>[] {
  const out: NormalizedTreeNode<T>[] = []
  walkTree(nodes, (n) => {
    out.push(n)
  })
  return out
}

/**
 * Collects every leaf value reachable from the given node (or roots).
 * The selection model emits leaves into v-model, so callers use this when
 * the user toggles a parent to know which values to add or remove.
 */
export function getLeafValues<T>(node: NormalizedTreeNode<T> | NormalizedTreeNode<T>[]): unknown[] {
  const out: unknown[] = []
  const roots = Array.isArray(node) ? node : [node]
  walkTree(roots, (n) => {
    if (n.isLeaf && !n.disabled) out.push(n.value)
  })
  return out
}

/**
 * Filters the tree against a search query, keeping any node whose own label
 * matches **or** whose subtree contains a match. Ancestors of matches are
 * preserved so the rendered tree stays well-formed.
 */
export function filterTree<T>(
  nodes: readonly NormalizedTreeNode<T>[],
  query: string,
  caseSensitive = false,
): NormalizedTreeNode<T>[] {
  const q = query.trim()
  if (!q) return [...nodes]
  const needle = caseSensitive ? q : q.toLowerCase()

  function visit(node: NormalizedTreeNode<T>): NormalizedTreeNode<T> | null {
    const haystack = caseSensitive ? node.label : node.label.toLowerCase()
    const selfMatch = haystack.includes(needle)

    const filteredChildren: NormalizedTreeNode<T>[] = []
    for (const child of node.children) {
      const kept = visit(child)
      if (kept) filteredChildren.push(kept)
    }

    if (!selfMatch && filteredChildren.length === 0) return null
    if (filteredChildren.length === node.children.length && selfMatch) return node
    // Re-shape with surviving children. Keep `isLeaf` honest — a parent with
    // all children filtered out behaves like a (still-non-selectable) leaf.
    return { ...node, children: filteredChildren }
  }

  const out: NormalizedTreeNode<T>[] = []
  for (const root of nodes) {
    const kept = visit(root)
    if (kept) out.push(kept)
  }
  return out
}

/**
 * Returns the ids on the path from the given node to the root, inclusive of
 * the node itself. Used to auto-expand ancestors when search reveals a match.
 */
export function getAncestorIds<T>(
  node: NormalizedTreeNode<T>,
  byId: Map<string, NormalizedTreeNode<T>>,
): string[] {
  const out: string[] = []
  let cursor: NormalizedTreeNode<T> | undefined = node
  while (cursor) {
    out.push(cursor.id)
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined
  }
  return out
}
