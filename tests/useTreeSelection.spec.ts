import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { useTreeSelection } from '@/composables/useTreeSelection'
import { normalizeTree, walkTree } from '@/core/tree'
import type { NormalizedTreeNode } from '@/types/tree-node'

interface Cat {
  id: number
  name: string
  children: Cat[]
}

const sample: Cat[] = [
  {
    id: 1,
    name: 'Web',
    children: [
      {
        id: 2,
        name: 'Frontend',
        children: [
          { id: 3, name: 'CSS', children: [] },
          { id: 4, name: 'JS', children: [] },
        ],
      },
      { id: 6, name: 'Backend', children: [{ id: 7, name: 'PHP', children: [] }] },
    ],
  },
  { id: 9, name: 'DevOps', children: [{ id: 10, name: 'Docker', children: [] }] },
]

function setup(initial: number[] = []) {
  const modelValue = ref<unknown>(initial)
  const tree = ref<NormalizedTreeNode<Cat>[]>(
    normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' }),
  )
  const emitUpdate = vi.fn((v: unknown) => {
    modelValue.value = v
  })
  const emitSelect = vi.fn()
  const emitDeselect = vi.fn()

  const api = useTreeSelection<Cat>({
    modelValue,
    tree,
    emitUpdate,
    emitSelect,
    emitDeselect,
  })

  function findById(id: number): NormalizedTreeNode<Cat> {
    let found: NormalizedTreeNode<Cat> | undefined
    walkTree(tree.value, (n) => {
      if (n.value === id) found = n
    })
    if (!found) throw new Error(`No node with id ${id}`)
    return found
  }

  return { ...api, modelValue, tree, findById, emitUpdate, emitSelect, emitDeselect }
}

describe('useTreeSelection — leaves', () => {
  it('toggles a leaf into v-model', () => {
    const { toggle, findById, emitUpdate, emitSelect } = setup([])
    toggle(findById(3))
    expect(emitUpdate).toHaveBeenLastCalledWith([3])
    expect(emitSelect).toHaveBeenCalledTimes(1)
  })

  it('removes a leaf when toggled twice', () => {
    const { toggle, findById, emitUpdate, emitDeselect } = setup([3])
    toggle(findById(3))
    expect(emitUpdate).toHaveBeenLastCalledWith([])
    expect(emitDeselect).toHaveBeenCalledTimes(1)
  })

  it('reports leaf check state', () => {
    const { getCheckState, findById } = setup([3])
    expect(getCheckState(findById(3))).toBe('checked')
    expect(getCheckState(findById(4))).toBe('unchecked')
  })
})

describe('useTreeSelection — parents', () => {
  it('selects every leaf below an unchecked parent', () => {
    const { toggle, findById, emitUpdate } = setup([])
    toggle(findById(2)) // Frontend → CSS, JS
    expect(emitUpdate).toHaveBeenLastCalledWith([3, 4])
  })

  it('clears every leaf below a checked parent', () => {
    const { toggle, findById, emitUpdate } = setup([3, 4])
    toggle(findById(2))
    expect(emitUpdate).toHaveBeenLastCalledWith([])
  })

  it('promotes an indeterminate parent to fully checked', () => {
    const { toggle, findById, emitUpdate } = setup([3])
    toggle(findById(2)) // partial → full
    expect(emitUpdate).toHaveBeenLastCalledWith([3, 4])
  })

  it('reports indeterminate when some but not all leaves are selected', () => {
    const { getCheckState, findById } = setup([3])
    expect(getCheckState(findById(2))).toBe('indeterminate')
  })

  it('reports checked when every descendant leaf is selected', () => {
    const { getCheckState, findById } = setup([3, 4, 7])
    expect(getCheckState(findById(1))).toBe('checked')
  })

  it('reports unchecked for a parent with no leaves selected', () => {
    const { getCheckState, findById } = setup([10])
    expect(getCheckState(findById(1))).toBe('unchecked')
  })
})

describe('useTreeSelection — caps and clear', () => {
  it('respects maxSelections when toggling a leaf', () => {
    const modelValue = ref<unknown>([3, 4])
    const tree = ref<NormalizedTreeNode<Cat>[]>(
      normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' }),
    )
    const emitUpdate = vi.fn()
    const { toggle } = useTreeSelection<Cat>({
      modelValue,
      tree,
      maxSelections: computed(() => 2),
      emitUpdate,
      emitSelect: vi.fn(),
      emitDeselect: vi.fn(),
    })
    let target: NormalizedTreeNode<Cat> | undefined
    walkTree(tree.value, (n) => {
      if (n.value === 7) target = n
    })
    toggle(target!) // would push to 3 — over the cap
    expect(emitUpdate).not.toHaveBeenCalled()
  })

  it('clear() empties the selection', () => {
    const { clear, emitUpdate } = setup([3, 4])
    clear()
    expect(emitUpdate).toHaveBeenLastCalledWith([])
  })

  it('selectAll() selects every enabled leaf', () => {
    const { selectAll, emitUpdate } = setup([])
    selectAll()
    expect(emitUpdate).toHaveBeenLastCalledWith([3, 4, 7, 10])
  })
})
