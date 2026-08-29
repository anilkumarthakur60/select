import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import VTreeSelect from '@/components/VTreeSelect'

// Regressions for the W4 audit findings. Each fails against the previous release.

interface Cat {
  id: number
  name: string
  children: Cat[]
}

const TREE: Cat[] = [
  {
    id: 1,
    name: 'Web',
    children: [
      {
        id: 2,
        name: 'Frontend',
        children: [
          { id: 3, name: 'CSS', children: [] },
          { id: 4, name: 'JavaScript', children: [] },
          { id: 5, name: 'TypeScript', children: [] },
        ],
      },
      { id: 6, name: 'Backend', children: [{ id: 7, name: 'Node', children: [] }] },
    ],
  },
  { id: 8, name: 'DevOps', children: [{ id: 9, name: 'Docker', children: [] }] },
]

const ACCESSORS = { optionValue: 'id', optionLabel: 'name' } as const

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

function mountTree(props: Record<string, unknown> = {}) {
  wrapper = mount(VTreeSelect, {
    props: { options: TREE, ...ACCESSORS, ...props },
    attachTo: document.body,
  })
  return wrapper
}

const key = (w: VueWrapper, k: string, selector = 'input.vselect-search') =>
  w.find(selector).trigger('keydown', { key: k })

const rowLabels = (w: VueWrapper) =>
  w.findAll('.vselect-tree-row .vselect-tree-label').map((n) => n.text())

describe('VTreeSelect keyboard support', () => {
  // There was NO keydown handler bound anywhere: the widget could not be
  // opened, navigated, selected or dismissed without a mouse, and nothing ever
  // carried aria-activedescendant.
  it('opens from the keyboard', async () => {
    const w = mountTree()
    expect(w.find('[role="tree"]').exists()).toBe(false)

    await key(w, 'ArrowDown')
    await nextTick()

    expect(w.find('[role="tree"]').exists()).toBe(true)
    expect(w.find('input.vselect-search').attributes('aria-expanded')).toBe('true')
  })

  it('tracks an active node via aria-activedescendant', async () => {
    const w = mountTree({ defaultExpandAll: true })
    await key(w, 'ArrowDown')
    await nextTick()
    await key(w, 'ArrowDown')
    await nextTick()

    const active = w.find('input.vselect-search').attributes('aria-activedescendant')
    expect(active).toBeDefined()
    expect(document.getElementById(active!)).not.toBeNull()
    expect(w.find('.vselect-tree-row.is-active').exists()).toBe(true)
  })

  it('selects the active node with Enter', async () => {
    const w = mountTree({ defaultExpandAll: true })
    await key(w, 'ArrowDown')
    await nextTick()
    await key(w, 'ArrowDown')
    await nextTick()
    await key(w, 'Enter')
    await nextTick()

    expect(w.emitted('update:modelValue')).toBeTruthy()
  })

  it('expands and collapses with ArrowRight / ArrowLeft', async () => {
    const w = mountTree()
    await key(w, 'ArrowDown')
    await nextTick()
    // Active is now "Web" (collapsed): its children are not rendered.
    expect(rowLabels(w)).not.toContain('Frontend')

    await key(w, 'ArrowRight')
    await nextTick()
    expect(rowLabels(w)).toContain('Frontend')

    await key(w, 'ArrowLeft')
    await nextTick()
    expect(rowLabels(w)).not.toContain('Frontend')
  })

  it('closes with Escape', async () => {
    const w = mountTree()
    await key(w, 'ArrowDown')
    await nextTick()
    expect(w.find('[role="tree"]').exists()).toBe(true)

    await key(w, 'Escape')
    await nextTick()
    expect(w.find('[role="tree"]').exists()).toBe(false)
  })
})

describe('VTreeSelect check state under a search', () => {
  // useTreeSelection got the FULL tree, but getCheckState received whatever
  // node the renderer handed it  and rows render from the FILTERED tree. So a
  // partially-selected parent counted only the surviving leaves: it rendered
  // and announced itself fully checked, and clicking it dropped only the
  // visible leaves while silently leaving the filtered-out ones selected.
  it('does not report a partially-selected parent as fully checked', async () => {
    const w = mountTree({ modelValue: [3], defaultExpandAll: true })
    await key(w, 'ArrowDown')
    await nextTick()

    await w.find('input.vselect-search').setValue('CSS')
    await nextTick()
    await nextTick()

    const frontend = w.findAll('.vselect-tree-row').find((r) => r.text().includes('Frontend'))
    expect(frontend?.attributes('aria-checked')).toBe('mixed')
  })

  it('toggling a parent while searching acts on the whole branch', async () => {
    const w = mountTree({ modelValue: [3, 4, 5], defaultExpandAll: true })
    await key(w, 'ArrowDown')
    await nextTick()
    await w.find('input.vselect-search').setValue('CSS')
    await nextTick()
    await nextTick()

    const frontend = w.findAll('.vselect-tree-row').find((r) => r.text().includes('Frontend'))
    await frontend!.trigger('mousedown')

    // Clearing a fully-checked branch must remove ALL its leaves, not just CSS.
    expect(w.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([])
  })
})

describe('VTreeSelect search expansion', () => {
  // The auto-expand watcher claimed "restored on query clear by the watcher
  // above", but that watcher keyed on `tree` identity, which a query change
  // never touches. Every search permanently opened more of the tree.
  it('collapses back to the baseline when the query clears', async () => {
    const w = mountTree({ defaultExpandAll: false })
    await key(w, 'ArrowDown')
    await nextTick()
    const before = rowLabels(w)

    await w.find('input.vselect-search').setValue('CSS')
    await nextTick()
    await nextTick()
    expect(rowLabels(w)).toContain('CSS')

    await w.find('input.vselect-search').setValue('')
    await nextTick()
    await nextTick()

    expect(rowLabels(w)).toEqual(before)
  })
})

describe('VTreeSelect lazy children', () => {
  // v-model holds leaf values only, but that was enforced only at selection
  // time. Lazy loading is the canonical tree pattern: a node ships with
  // `children: []` so it is a legitimate leaf; once its children arrive the
  // value is a PARENT id  no tag rendered, its own row showed unchecked, yet
  // the toolbar counted it and the hidden input still submitted it.
  it('drops a value that is no longer a leaf', async () => {
    const lazy: Cat[] = [{ id: 2, name: 'Frontend', children: [] }]
    const w = mount(VTreeSelect, {
      props: { options: lazy, modelValue: [2], ...ACCESSORS },
      attachTo: document.body,
    })
    wrapper = w

    await w.setProps({
      options: [
        {
          id: 2,
          name: 'Frontend',
          children: [{ id: 3, name: 'CSS', children: [] }],
        },
      ],
    })
    await nextTick()

    expect(w.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([])
  })

  it('does not wipe the selection while options are briefly empty', async () => {
    const w = mountTree({ modelValue: [3] })
    await w.setProps({ options: [] })
    await nextTick()

    expect(w.emitted('update:modelValue')).toBeFalsy()
  })
})

describe('VTreeSelect autofocus', () => {
  it('lands on the search input, not the control wrapper', async () => {
    const w = mountTree({ autofocus: false })
    await w.setProps({ autofocus: true })
    await nextTick()
    await nextTick()

    expect(document.activeElement).toBe(w.find('input.vselect-search').element)
  })
})
