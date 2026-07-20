import { describe, expect, it, vi } from 'vitest'
import { filterTree, flattenTree, getLeafValues, normalizeTree, walkTree } from '@/tree'
import { resetWarnings } from '@/warn'

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

describe('normalizeTree', () => {
  it('reads value/label from accessors and computes depth + isLeaf', () => {
    const tree = normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' })
    expect(tree).toHaveLength(2)
    expect(tree[0]?.value).toBe(1)
    expect(tree[0]?.label).toBe('Web')
    expect(tree[0]?.depth).toBe(0)
    expect(tree[0]?.isLeaf).toBe(false)

    const css = tree[0]?.children[0]?.children[0]
    expect(css?.value).toBe(3)
    expect(css?.label).toBe('CSS')
    expect(css?.depth).toBe(2)
    expect(css?.isLeaf).toBe(true)
  })

  it('treats empty `children: []` as leaves', () => {
    const flat = normalizeTree(
      [
        { id: 3, name: 'CSS', children: [] },
        { id: 4, name: 'JS', children: [] },
      ],
      { optionValue: 'id', optionLabel: 'name' },
    )
    expect(flat.every((n) => n.isLeaf)).toBe(true)
  })

  it('falls back to `id` and `name` when no accessor is given', () => {
    const tree = normalizeTree(sample, {})
    expect(tree[0]?.value).toBe(1)
    expect(tree[0]?.label).toBe('Web')
  })

  it('produces stable, unique ids', () => {
    const tree = normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' })
    const ids = flattenTree(tree).map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('parentId points back at the correct ancestor', () => {
    const tree = normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' })
    const root = tree[0]!
    expect(root.parentId).toBeNull()
    expect(root.children[0]?.parentId).toBe(root.id)
  })
})

describe('walkTree / flattenTree', () => {
  it('visits every node depth-first', () => {
    const tree = normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' })
    const visited: number[] = []
    walkTree(tree, (n) => {
      visited.push(n.value as number)
    })
    expect(visited).toEqual([1, 2, 3, 4, 6, 7, 9, 10])
  })

  it('flattenTree returns the same DFS order as an array', () => {
    const tree = normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' })
    expect(flattenTree(tree).map((n) => n.value)).toEqual([1, 2, 3, 4, 6, 7, 9, 10])
  })
})

describe('getLeafValues', () => {
  it('collects only leaves under a parent', () => {
    const tree = normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' })
    const frontend = tree[0]!.children[0]!
    expect(getLeafValues(frontend)).toEqual([3, 4])
  })

  it('walks every root when given the array form', () => {
    const tree = normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' })
    expect(getLeafValues(tree).sort((a, b) => (a as number) - (b as number))).toEqual([3, 4, 7, 10])
  })

  it('skips disabled leaves', () => {
    const data = [
      {
        id: 1,
        name: 'A',
        children: [
          { id: 2, name: 'A.1', disabled: true, children: [] },
          { id: 3, name: 'A.2', children: [] },
        ],
      },
    ]
    const tree = normalizeTree(data, { optionValue: 'id', optionLabel: 'name' })
    expect(getLeafValues(tree)).toEqual([3])
  })
})

describe('filterTree', () => {
  it('returns the original tree for an empty query', () => {
    const tree = normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' })
    expect(filterTree(tree, '')).toEqual(tree)
  })

  it('keeps ancestors of matching leaves', () => {
    const tree = normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' })
    const filtered = filterTree(tree, 'docker')
    // Only "DevOps → Docker" survives.
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.label).toBe('DevOps')
    expect(filtered[0]?.children).toHaveLength(1)
    expect(filtered[0]?.children[0]?.label).toBe('Docker')
  })

  it('matches on parent labels too', () => {
    const tree = normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' })
    const filtered = filterTree(tree, 'frontend')
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.children[0]?.label).toBe('Frontend')
  })

  // These two are the point of the test above. It asserted only that the
  // matched parent survived — never that it kept its subtree — so filterTree
  // shipped returning `{ isLeaf: false, children: [] }` for a matched branch.
  // That row rendered a checkbox and an expand chevron but had nothing to
  // select or expand: clicking it emitted no model update while the checkbox
  // stayed visually ticked, because Vue never patched `checked` back.
  it('keeps the whole subtree of a node matched on its own label', () => {
    const tree = normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' })
    const matched = filterTree(tree, 'Frontend')[0]?.children[0]

    expect(matched?.label).toBe('Frontend')
    expect(matched?.isLeaf).toBe(false)
    expect(matched?.children.map((c) => c.label)).toEqual(['CSS', 'JS'])
    expect(getLeafValues(matched!)).toEqual([3, 4])
  })

  it('never produces a non-leaf node with zero children', () => {
    const tree = normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' })
    for (const query of ['Frontend', 'Web', 'CSS', 'e', 'DevOps']) {
      for (const node of flattenTree(filterTree(tree, query))) {
        expect(node.isLeaf || node.children.length > 0).toBe(true)
      }
    }
  })

  it('is case-insensitive by default', () => {
    const tree = normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' })
    expect(filterTree(tree, 'CSS')).toHaveLength(1)
    expect(filterTree(tree, 'css')).toHaveLength(1)
  })
})

describe('normalizeTree — malformed input', () => {
  it('drops a cyclic node instead of blowing the stack', () => {
    interface Node {
      id: string
      name: string
      children: Node[]
    }
    const a: Node = { id: 'a', name: 'A', children: [] }
    a.children.push(a) // node is its own child

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    resetWarnings()

    // Unguarded this threw RangeError out of the Vue `computed` that calls it
    // during render, taking the component tree down rather than degrading.
    // Cycles arrive easily from graph-shaped server data.
    expect(() => normalizeTree([a], { optionValue: 'id', optionLabel: 'name' })).not.toThrow()

    const tree = normalizeTree([a], { optionValue: 'id', optionLabel: 'name' })
    expect(tree).toHaveLength(1)
    expect(tree[0]?.children).toHaveLength(0)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('does not render an object label as "[object Object]"', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    resetWarnings()

    // `label` is the only field filterTree matches against, so coercing an
    // i18n-shaped label to "[object Object]" also made the node unfindable.
    const tree = normalizeTree([{ id: 1, name: { en: 'Web' }, children: [] }] as never, {
      optionValue: 'id',
    })

    expect(tree[0]?.label).not.toContain('[object')
    expect(tree[0]?.label).toBe('1')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('keeps ids unique and readable for object-valued nodes', () => {
    const tree = normalizeTree(
      [
        { value: { k: 'a' }, label: 'A', children: [] },
        { value: { k: 'b' }, label: 'B', children: [] },
      ] as never,
      {},
    )
    const ids = tree.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.some((id) => id.includes('[object'))).toBe(false)
  })
})
