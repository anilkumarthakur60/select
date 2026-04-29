import { computed, type ComputedRef, type Ref } from 'vue'
import type { NormalizedTreeNode, TreeNodeCheckState } from '@/types/tree-node'
import { flattenTree, getLeafValues, walkTree } from '@/core/tree'

export interface UseTreeSelectionOptions<T> {
  /** v-model — array of leaf values. */
  modelValue: Ref<unknown>
  /** Normalised tree to evaluate state against. */
  tree: Ref<NormalizedTreeNode<T>[]>
  /** Cap the total number of selected leaves. Optional. */
  maxSelections?: Ref<number | undefined>
  emitUpdate: (value: unknown[]) => void
  emitSelect: (node: NormalizedTreeNode<T>) => void
  emitDeselect: (node: NormalizedTreeNode<T>) => void
}

export interface UseTreeSelectionReturn<T> {
  selectedValues: ComputedRef<unknown[]>
  isLeafSelected: (node: NormalizedTreeNode<T>) => boolean
  /** Tri-state for parents — for leaves, `'checked'` or `'unchecked'`. */
  getCheckState: (node: NormalizedTreeNode<T>) => TreeNodeCheckState
  /** Toggle a leaf or — if the node is a parent — every selectable leaf below it. */
  toggle: (node: NormalizedTreeNode<T>) => void
  selectAll: () => void
  clear: () => void
}

/**
 * Tree-aware selection state. Only **leaves** are stored in v-model — parent
 * checkbox state is always derived from the leaves below it. This keeps the
 * caller's value contract simple ("here's an array of ids") and matches the
 * common UX of tree-pickers like Element Plus / Ant Design.
 *
 * Indeterminate parents are computed fresh on read; for trees of practical
 * size (hundreds of nodes) this is cheap, and avoids the bug class of
 * cached-state-getting-out-of-sync after async option reloads.
 */
export function useTreeSelection<T>(opts: UseTreeSelectionOptions<T>): UseTreeSelectionReturn<T> {
  const selectedValues = computed<unknown[]>(() => {
    const value = opts.modelValue.value
    if (value == null || value === '') return []
    return Array.isArray(value) ? value : [value]
  })

  // Set keeps `getCheckState` (called per row on every render) at O(1)
  // average lookup — for trees of any non-trivial size the previous
  // `Array.some` walk was the dominant cost.
  const selectedSet = computed(() => new Set(selectedValues.value))

  function isLeafSelected(node: NormalizedTreeNode<T>): boolean {
    return selectedSet.value.has(node.value)
  }

  function getCheckState(node: NormalizedTreeNode<T>): TreeNodeCheckState {
    if (node.isLeaf) return isLeafSelected(node) ? 'checked' : 'unchecked'

    const set = selectedSet.value
    let total = 0
    let selected = 0
    // Walk descendants, counting only enabled leaves — disabled leaves can't
    // be toggled, so they shouldn't influence the parent's tri-state.
    const stack: NormalizedTreeNode<T>[] = node.children.slice()
    while (stack.length) {
      const cur = stack.pop()!
      if (cur.isLeaf) {
        if (cur.disabled) continue
        total += 1
        if (set.has(cur.value)) selected += 1
      } else {
        for (const c of cur.children) stack.push(c)
      }
    }

    if (total === 0 || selected === 0) return 'unchecked'
    if (selected === total) return 'checked'
    return 'indeterminate'
  }

  function withCap(next: unknown[]): unknown[] {
    const cap = opts.maxSelections?.value
    if (cap === undefined || next.length <= cap) return next
    return next.slice(0, cap)
  }

  function toggleLeaf(node: NormalizedTreeNode<T>) {
    if (node.disabled) return
    const current = selectedValues.value
    if (selectedSet.value.has(node.value)) {
      opts.emitUpdate(current.filter((v) => v !== node.value))
      opts.emitDeselect(node)
      return
    }
    const cap = opts.maxSelections?.value
    if (cap !== undefined && current.length >= cap) return
    opts.emitUpdate([...current, node.value])
    opts.emitSelect(node)
  }

  function toggleParent(node: NormalizedTreeNode<T>) {
    const state = getCheckState(node)
    const leafValues = getLeafValues(node)
    if (leafValues.length === 0) return

    const current = selectedValues.value
    const set = selectedSet.value

    if (state === 'checked') {
      const removeSet = new Set(leafValues)
      const next = current.filter((v) => !removeSet.has(v))
      opts.emitUpdate(next)
      walkTree(node.children, (child) => {
        if (child.isLeaf && !child.disabled) opts.emitDeselect(child)
      })
      return
    }

    // unchecked or indeterminate → select every selectable leaf under this branch.
    const merged = current.slice()
    for (const v of leafValues) {
      if (!set.has(v)) merged.push(v)
    }
    opts.emitUpdate(withCap(merged))
    walkTree(node.children, (child) => {
      if (child.isLeaf && !child.disabled && !set.has(child.value)) opts.emitSelect(child)
    })
  }

  function toggle(node: NormalizedTreeNode<T>) {
    if (node.disabled) return
    if (node.isLeaf) toggleLeaf(node)
    else toggleParent(node)
  }

  function selectAll() {
    const all: unknown[] = []
    walkTree(opts.tree.value, (n) => {
      if (n.isLeaf && !n.disabled) all.push(n.value)
    })
    opts.emitUpdate(withCap(all))
  }

  function clear() {
    if (selectedValues.value.length === 0) return
    const cleared = selectedSet.value
    opts.emitUpdate([])
    // Best-effort deselect — only emit for leaves that exist in the current tree.
    for (const node of flattenTree(opts.tree.value)) {
      if (node.isLeaf && cleared.has(node.value)) opts.emitDeselect(node)
    }
  }

  return { selectedValues, isLeafSelected, getCheckState, toggle, selectAll, clear }
}
