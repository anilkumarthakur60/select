import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import VSelect from '@/components/VSelect'

const FRUITS = ['Apple', 'Banana', 'Cherry']

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

function open(w: VueWrapper) {
  return w.find('.vselect-control').trigger('mousedown')
}

describe('<VSelect>  single mode', () => {
  it('renders the placeholder when nothing is selected', () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, placeholder: 'Pick…' },
    })
    expect(wrapper.find('input.vselect-search').attributes('placeholder')).toBe('Pick…')
  })

  it('renders the placeholder span when not searchable', () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, placeholder: 'Pick…', searchable: false },
    })
    expect(wrapper.text()).toContain('Pick…')
  })

  it('opens the menu on control mousedown', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS },
      attachTo: document.body,
    })
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    await open(wrapper)
    await nextTick()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
  })

  it('highlights the currently selected option when opening', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, modelValue: 'Cherry' },
      attachTo: document.body,
    })
    await open(wrapper)
    await nextTick()
    const active = wrapper.find('.vselect-option.is-active')
    expect(active.exists()).toBe(true)
    expect(active.text()).toContain('Cherry')
  })

  it('hides the search input when a value is selected and the user is not typing', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, modelValue: 'Apple' },
      attachTo: document.body,
    })
    await nextTick()
    expect(wrapper.find('input.vselect-search').classes()).toContain('is-hidden')
    await open(wrapper)
    await nextTick()
    expect(wrapper.find('input.vselect-search').classes()).toContain('is-hidden')
  })

  it('emits update:modelValue on option pick', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS },
      attachTo: document.body,
    })
    await open(wrapper)
    await nextTick()
    const options = wrapper.findAll('[role="option"]')
    await options[1]!.trigger('mousedown')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['Banana'])
  })

  it('renders the selected label', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, modelValue: 'Cherry' },
    })
    expect(wrapper.find('.vselect-single').text()).toBe('Cherry')
  })

  it('honours `disabled`', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, disabled: true },
      attachTo: document.body,
    })
    await open(wrapper)
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('exposes open / close / clear via instance', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, modelValue: 'Apple' },
      attachTo: document.body,
    })
    const exposed = wrapper.vm as unknown as {
      open: () => void
      close: () => void
      clear: () => void
      isOpen: boolean
    }
    exposed.open()
    await nextTick()
    expect(exposed.isOpen).toBe(true)
    exposed.close()
    await nextTick()
    expect(exposed.isOpen).toBe(false)
    exposed.clear()
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([null])
  })
})

describe('<VSelect>  multiple mode', () => {
  it('renders one tag per selected value', () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, mode: 'multiple', modelValue: ['Apple', 'Banana'] },
    })
    expect(wrapper.findAll('.vselect-tag')).toHaveLength(2)
  })

  it('toggles values on subsequent picks', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, mode: 'multiple', modelValue: [] },
      attachTo: document.body,
    })
    await open(wrapper)
    await nextTick()
    const options = wrapper.findAll('[role="option"]')
    await options[0]!.trigger('mousedown')
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([['Apple']])
  })

  it('collapses overflowing tags into a +N chip', () => {
    wrapper = mount(VSelect, {
      props: {
        options: FRUITS,
        mode: 'multiple',
        modelValue: ['Apple', 'Banana', 'Cherry'],
        maxVisibleTags: 1,
      },
    })
    expect(wrapper.find('.vselect--overflow, .vselect-tag--overflow').text()).toBe('+2')
  })
})

describe('<VSelect>  accessors and grouping', () => {
  interface Country {
    code: string
    name: string
    region: string
  }
  const COUNTRIES: Country[] = [
    { code: 'us', name: 'United States', region: 'Americas' },
    { code: 'br', name: 'Brazil', region: 'Americas' },
    { code: 'fr', name: 'France', region: 'Europe' },
  ]

  it('reads value/label/group via prop accessors', async () => {
    wrapper = mount(VSelect, {
      props: {
        options: COUNTRIES,
        optionValue: 'code',
        optionLabel: 'name',
        optionGroup: 'region',
      },
      attachTo: document.body,
    })
    await open(wrapper)
    await nextTick()
    expect(wrapper.findAll('.vselect-group')).toHaveLength(2) // Americas + Europe
    expect(wrapper.text()).toContain('United States')
  })
})

describe('<VSelect>  aria wiring', () => {
  // Under WAI-ARIA 1.2 the combobox is the element that RECEIVES FOCUS. When
  // searchable (the default) that is the search input  the control div carries
  // tabindex={-1} and can never be focused, so declaring the role there meant a
  // screen reader announced the focused element as a plain edit field and was
  // never told the popup opened or closed. This test used to assert the role
  // sat on the control, which is what made the defect look intentional.
  it('puts role=combobox + aria-expanded on the focusable search input', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS },
      attachTo: document.body,
    })
    const search = wrapper.find('input.vselect-search')
    expect(search.attributes('role')).toBe('combobox')
    expect(search.attributes('aria-expanded')).toBe('false')
    // ...and not on the unfocusable wrapper.
    expect(wrapper.find('.vselect-control').attributes('role')).toBeUndefined()

    await open(wrapper)
    await nextTick()
    expect(wrapper.find('input.vselect-search').attributes('aria-expanded')).toBe('true')
  })

  it('puts role=combobox on the control when not searchable', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, searchable: false },
      attachTo: document.body,
    })
    // With no search input rendered, the control IS the focusable element.
    const control = wrapper.find('.vselect-control')
    expect(control.attributes('role')).toBe('combobox')
    expect(control.attributes('aria-expanded')).toBe('false')
    expect(control.attributes('tabindex')).toBe('0')
  })

  it('keeps an accessible name on the search input after a value is picked', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, ariaLabel: 'Favourite fruit', modelValue: FRUITS[0] },
      attachTo: document.body,
    })
    // The placeholder is stripped once a value exists, and `ariaLabel` used to
    // land on the unfocusable div  leaving the focused input with no
    // accessible name at all.
    const search = wrapper.find('input.vselect-search')
    expect(search.attributes('placeholder')).toBeUndefined()
    expect(search.attributes('aria-label')).toBe('Favourite fruit')
  })
})
