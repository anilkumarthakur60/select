import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import VTreeSelect from '@/components/VTreeSelect'

interface Cat {
  id: number
  name: string
  children: Cat[]
}

const SAMPLE: Cat[] = [
  {
    id: 1,
    name: 'Web',
    children: [
      { id: 2, name: 'CSS', children: [] },
      { id: 3, name: 'JavaScript', children: [] },
    ],
  },
  {
    id: 9,
    name: 'DevOps',
    children: [{ id: 10, name: 'Docker', children: [] }],
  },
]

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

function open(w: VueWrapper) {
  return w.find('.vselect-control').trigger('mousedown')
}

describe('<VTreeSelect>', () => {
  it('renders the placeholder when nothing is selected', () => {
    wrapper = mount(VTreeSelect, {
      props: {
        options: SAMPLE,
        optionValue: 'id',
        optionLabel: 'name',
        placeholder: 'Pick a category',
      },
    })
    expect(wrapper.find('input.vselect-search').attributes('placeholder')).toBe('Pick a category')
  })

  it('renders the placeholder span when not searchable', () => {
    wrapper = mount(VTreeSelect, {
      props: {
        options: SAMPLE,
        optionValue: 'id',
        optionLabel: 'name',
        placeholder: 'Pick a category',
        searchable: false,
      },
    })
    expect(wrapper.text()).toContain('Pick a category')
  })

  it('opens the tree when the chevron icon is clicked', async () => {
    wrapper = mount(VTreeSelect, {
      props: {
        options: SAMPLE,
        optionValue: 'id',
        optionLabel: 'name',
      },
      attachTo: document.body,
    })
    const chevron = wrapper.find('.vselect-chevron')
    expect(chevron.exists()).toBe(true)
    await chevron.trigger('mousedown')
    await nextTick()
    expect(wrapper.find('[role="tree"]').exists()).toBe(true)
  })

  it('opens the tree on control mousedown', async () => {
    wrapper = mount(VTreeSelect, {
      props: {
        options: SAMPLE,
        optionValue: 'id',
        optionLabel: 'name',
        defaultExpandAll: true,
      },
      attachTo: document.body,
    })
    expect(wrapper.find('[role="tree"]').exists()).toBe(false)
    await open(wrapper)
    await nextTick()
    expect(wrapper.find('[role="tree"]').exists()).toBe(true)
  })

  it('renders one row per node with proper aria-level', async () => {
    wrapper = mount(VTreeSelect, {
      props: {
        options: SAMPLE,
        optionValue: 'id',
        optionLabel: 'name',
        defaultExpandAll: true,
      },
      attachTo: document.body,
    })
    await open(wrapper)
    await nextTick()
    const rows = wrapper.findAll('[role="treeitem"]')
    expect(rows.length).toBeGreaterThanOrEqual(5) // 2 roots + 3 leaves
    // Roots are aria-level 1, leaves under Web are aria-level 2
    const levels = rows.map((r) => r.attributes('aria-level'))
    expect(levels).toContain('1')
    expect(levels).toContain('2')
  })

  it('emits leaf values via update:modelValue when a leaf is toggled', async () => {
    wrapper = mount(VTreeSelect, {
      props: {
        options: SAMPLE,
        optionValue: 'id',
        optionLabel: 'name',
        defaultExpandAll: true,
        modelValue: [],
      },
      attachTo: document.body,
    })
    await open(wrapper)
    await nextTick()
    // Find the row labelled "CSS" and click its checkbox
    const rows = wrapper.findAll('[role="treeitem"]')
    const css = rows.find((r) => r.text().includes('CSS'))!
    await css.find('input[type="checkbox"]').trigger('change')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([[2]])
  })

  it('toggles every leaf under a parent when the parent is checked', async () => {
    wrapper = mount(VTreeSelect, {
      props: {
        options: SAMPLE,
        optionValue: 'id',
        optionLabel: 'name',
        defaultExpandAll: true,
        modelValue: [],
      },
      attachTo: document.body,
    })
    await open(wrapper)
    await nextTick()
    const rows = wrapper.findAll('[role="treeitem"]')
    const web = rows.find((r) => r.text().includes('Web') && r.attributes('aria-level') === '1')!
    await web.find('input[type="checkbox"]').trigger('change')
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([[2, 3]])
  })

  it('renders the toolbar by default with a working Select all', async () => {
    wrapper = mount(VTreeSelect, {
      props: {
        options: SAMPLE,
        optionValue: 'id',
        optionLabel: 'name',
        defaultExpandAll: true,
        modelValue: [],
      },
      attachTo: document.body,
    })
    await open(wrapper)
    await nextTick()
    const selectAll = wrapper
      .findAll('.vselect-tree-toolbar-action')
      .find((b) => b.text() === 'Select all')!
    await selectAll.trigger('mousedown')
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([[2, 3, 10]])
  })

  it('toggles every parent via the Expand all / Collapse all toolbar button', async () => {
    wrapper = mount(VTreeSelect, {
      props: {
        options: SAMPLE,
        optionValue: 'id',
        optionLabel: 'name',
      },
      attachTo: document.body,
    })
    await open(wrapper)
    await nextTick()
    // Nothing expanded by default — only the two roots are rendered.
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2)

    const action = () =>
      wrapper!
        .findAll('.vselect-tree-toolbar-action')
        .find((b) => b.text() === 'Expand all' || b.text() === 'Collapse all')!

    expect(action().text()).toBe('Expand all')
    await action().trigger('mousedown')
    await nextTick()
    // Every parent now expanded — leaves render too (2 roots + 3 leaves = 5).
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(5)
    expect(action().text()).toBe('Collapse all')

    await action().trigger('mousedown')
    await nextTick()
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2)
    expect(action().text()).toBe('Expand all')
  })

  it('exposes expandAll / collapseAll on the instance', async () => {
    wrapper = mount(VTreeSelect, {
      props: {
        options: SAMPLE,
        optionValue: 'id',
        optionLabel: 'name',
      },
      attachTo: document.body,
    })
    await open(wrapper)
    await nextTick()
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2)
    ;(wrapper.vm as unknown as { expandAll: () => void }).expandAll()
    await nextTick()
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(5)
    ;(wrapper.vm as unknown as { collapseAll: () => void }).collapseAll()
    await nextTick()
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2)
  })

  it('hides the toolbar when show-toolbar is false', async () => {
    wrapper = mount(VTreeSelect, {
      props: {
        options: SAMPLE,
        optionValue: 'id',
        optionLabel: 'name',
        defaultExpandAll: true,
        showToolbar: false,
      },
      attachTo: document.body,
    })
    await open(wrapper)
    await nextTick()
    expect(wrapper.find('.vselect-tree-toolbar').exists()).toBe(false)
  })
})
