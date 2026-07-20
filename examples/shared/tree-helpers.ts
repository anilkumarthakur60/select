// Pure helpers for the tree-select playground examples. These wrap the
// core's `normalizeTree` / `walkTree` / `getLeafValues` / `filterTree` so each
// framework playground can render a working checkbox tree without rebuilding
// the selection logic from scratch.

import {
  filterTree,
  getLeafValues,
  normalizeTree,
  walkTree,
  type NormalizedTreeNode,
  type TreeOptionLike,
} from '@anil-labs/select-core'

export type CheckState = 'unchecked' | 'indeterminate' | 'checked'

export function buildTree<T extends TreeOptionLike>(
  options: readonly T[],
  optionChildren: string = 'children',
): NormalizedTreeNode<T>[] {
  // The core's `optionChildren` accessor is `keyof T | ((node: T) => T[])`.
  // Playgrounds pass the bare prop name as a string; cast through `keyof T`
  // since `T extends object` (TreeOptionLike) gives the type-checker no
  // grounds to accept arbitrary strings.
  return normalizeTree(options, { optionChildren: optionChildren as keyof T })
}

/** Apply a search query, returning a filtered tree that preserves ancestors. */
export function searchTree<T>(
  tree: NormalizedTreeNode<T>[],
  query: string,
): NormalizedTreeNode<T>[] {
  return filterTree(tree, query)
}

/**
 * Compute the check state for a single node given the set of selected leaf
 * values. A leaf is straight checked/unchecked; a parent is checked when all
 * of its leaf descendants are selected, indeterminate when some are.
 */
export function checkStateOf<T>(
  node: NormalizedTreeNode<T>,
  selected: ReadonlySet<unknown>,
): CheckState {
  if (node.isLeaf) {
    return selected.has(node.value) ? 'checked' : 'unchecked'
  }
  const leafValues = getLeafValues(node)
  if (leafValues.length === 0) return 'unchecked'
  let hit = 0
  for (const v of leafValues) if (selected.has(v)) hit += 1
  if (hit === 0) return 'unchecked'
  if (hit === leafValues.length) return 'checked'
  return 'indeterminate'
}

/**
 * Toggle a node. For leaves: add/remove the value. For parents: select all
 * descendant leaves if currently fully checked or partial; deselect all if
 * fully checked. Returns the next selection array.
 */
export function toggleNode<T>(
  node: NormalizedTreeNode<T>,
  selected: readonly unknown[],
): unknown[] {
  const set = new Set(selected)
  if (node.isLeaf) {
    if (set.has(node.value)) set.delete(node.value)
    else set.add(node.value)
    return Array.from(set)
  }
  const leaves = getLeafValues(node)
  const allChecked = leaves.every((v) => set.has(v))
  if (allChecked) {
    for (const v of leaves) set.delete(v)
  } else {
    for (const v of leaves) set.add(v)
  }
  return Array.from(set)
}

/**
 * IDs of every parent node in the tree, useful for "expand all" defaults.
 */
export function allParentIds<T>(tree: NormalizedTreeNode<T>[]): string[] {
  const out: string[] = []
  walkTree(tree, (n) => {
    if (!n.isLeaf) out.push(n.id)
  })
  return out
}
