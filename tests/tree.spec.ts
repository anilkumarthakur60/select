import { describe, expect, it } from 'vitest'
import { filterTree, flattenTree, getLeafValues, normalizeTree, walkTree } from '@/core/tree'

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

  it('is case-insensitive by default', () => {
    const tree = normalizeTree(sample, { optionValue: 'id', optionLabel: 'name' })
    expect(filterTree(tree, 'CSS')).toHaveLength(1)
    expect(filterTree(tree, 'css')).toHaveLength(1)
  })
})
