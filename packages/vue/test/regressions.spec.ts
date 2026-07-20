import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { FilterFn } from '@anil-labs/select-core'
import VSelect from '@/components/VSelect'
import VSelectTag from '@/components/VSelectTag'
import { useFormBinding } from '@/composables/useFormBinding'
import { useOptionFilter } from '@/composables/useOptionFilter'

// Regressions for the W3 audit findings. Each of these fails against the
// previous release.

const FRUITS = ['Apple', 'Banana', 'Cherry']

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

const open = (w: VueWrapper) => w.find('.vselect-control').trigger('mousedown')

/**
 * Dispatch a real click with a chosen `detail`. @vue/test-utils cannot set it
 * (UIEvent.detail is getter-only), and `detail` is exactly what distinguishes a
 * keyboard-synthesised click (0) from a pointer click (>=1).
 */
function click(el: Element, detail: number) {
  el.dispatchEvent(new MouseEvent('click', { detail, bubbles: true, cancelable: true }))
  return nextTick()
}

describe('closeOnSelect', () => {
  // `closeOnSelect: { type: Boolean }` with no default: Vue coerces an absent
  // Boolean prop to `false`, never `undefined`, so the resolver
  // `props.closeOnSelect ?? props.mode === 'single'` could not reach its
  // fallback. A default single-select never closed, leaving the listbox
  // mounted and aria-expanded="true" — while every other adapter closed.
  it('closes a default single-select after a pick', async () => {
    wrapper = mount(VSelect, { props: { options: FRUITS }, attachTo: document.body })
    await open(wrapper)
    await nextTick()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)

    await wrapper.findAll('[role="option"]')[0]!.trigger('mousedown')
    await nextTick()

    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(wrapper.find('input.vselect-search').attributes('aria-expanded')).toBe('false')
  })

  it('honours an explicit false in single mode', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, closeOnSelect: false },
      attachTo: document.body,
    })
    await open(wrapper)
    await nextTick()
    await wrapper.findAll('[role="option"]')[0]!.trigger('mousedown')
    await nextTick()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
  })
})

describe('focus()', () => {
  // `a?.focus() ?? b?.focus()` — HTMLElement.focus() returns undefined, so the
  // ?? ALWAYS evaluated its right side: both ran and the control div won. The
  // control has tabindex={-1} when searchable and ignores keydown in that
  // mode, so the user was left on an element accepting neither text nor arrows.
  it('focuses the search input, not the control div', async () => {
    wrapper = mount(VSelect, { props: { options: FRUITS }, attachTo: document.body })
    ;(wrapper.vm as unknown as { focus: () => void }).focus()
    await nextTick()

    expect(document.activeElement).toBe(wrapper.find('input.vselect-search').element)
  })

  it('autofocus lands on the search input', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, autofocus: false },
      attachTo: document.body,
    })
    await wrapper.setProps({ autofocus: true })
    await nextTick()
    await nextTick()

    expect(document.activeElement).toBe(wrapper.find('input.vselect-search').element)
  })
})

describe('keyboard-operable clear and tag remove', () => {
  // Both were tabindex={-1} with mousedown-only handlers. Keyboard activation
  // of a <button> arrives as `click`, never `mousedown`, so they were inert —
  // and in single mode there was no keyboard path to clear at all.
  it('clears via a keyboard-synthesised click', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, modelValue: 'Apple' },
      attachTo: document.body,
    })
    const clear = wrapper.find('button.vselect-indicator')
    expect(clear.attributes('tabindex')).toBe('0')

    // detail 0 is what a browser reports for Enter/Space on a button.
    await click(clear.element, 0)

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
  })

  it('does not double-fire on a real mouse click', async () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, modelValue: 'Apple' },
      attachTo: document.body,
    })
    const clear = wrapper.find('button.vselect-indicator')
    await clear.trigger('mousedown')
    await click(clear.element, 1)

    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })

  it('tag remove is reachable and keyboard-operable', async () => {
    const tag = mount(VSelectTag, {
      props: { option: { id: 'a', value: 'a', label: 'Apple', raw: 'a' } },
    })
    const button = tag.find('button.vselect-tag-remove')
    expect(button.attributes('tabindex')).toBe('0')

    await click(button.element, 0)
    expect(tag.emitted('remove')).toHaveLength(1)
    tag.unmount()
  })
})

describe('empty-string option value', () => {
  // `if (value == null || value === '') return []` treated '' as "nothing
  // selected", but select() happily emitted '' — so the classic
  // <option value="">None</option> appeared to do nothing. 0 and false always
  // worked, marking '' as an accidental over-broad emptiness test.
  it('renders a selection whose value is the empty string', () => {
    wrapper = mount(VSelect, {
      props: {
        options: [
          { value: '', label: 'None' },
          { value: 'a', label: 'Apple' },
        ],
        modelValue: '',
      },
      attachTo: document.body,
    })

    expect(wrapper.find('.vselect-single').text()).toBe('None')
    expect(wrapper.classes()).toContain('has-value')
  })
})

describe('useFormBinding', () => {
  // The empty branch used the unsuffixed `name` while the populated branch used
  // `${name}[]`, so the FormData key flipped with the selection count. The
  // documented read path getAll('skills[]') returned nothing precisely when the
  // user had deselected everything.
  it('keeps the field name stable across populated -> empty', () => {
    const values = ref<readonly unknown[]>(['a'])
    const { hiddenInputs } = useFormBinding({
      name: ref('skills'),
      required: ref(false),
      values,
      isMulti: ref(true),
    })
    expect(hiddenInputs.value[0]?.name).toBe('skills[]')

    values.value = []
    expect(hiddenInputs.value[0]?.name).toBe('skills[]')
  })

  // hiddenInputs is a computed read during render, so an unguarded
  // JSON.stringify throw took the whole component down — and only when `name`
  // was set. Circular values are ordinary in ORM-shaped data.
  it('survives a circular object value instead of crashing the render', () => {
    const circular: Record<string, unknown> = { name: 'Grace' }
    circular.self = circular
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { hiddenInputs } = useFormBinding({
      name: ref('user'),
      required: ref(false),
      values: ref([circular]),
      isMulti: ref(false),
    })

    expect(() => hiddenInputs.value).not.toThrow()
    expect(hiddenInputs.value[0]?.value).toBe('')
    warn.mockRestore()
  })
})

describe('native validation', () => {
  // Hidden inputs are barred from constraint validation, so `required` on them
  // is ignored entirely: a <VSelect name required> with no selection submitted
  // cleanly, while aria-required told screen readers the field was required.
  it('renders a validatable control, not type=hidden, when required', () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, name: 'fruit', required: true },
      attachTo: document.body,
    })

    const input = wrapper.find('.vselect-validation-input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).not.toBe('hidden')
    expect((input.element as HTMLInputElement).willValidate).toBe(true)
    expect((input.element as HTMLInputElement).checkValidity()).toBe(false)
  })

  it('passes validation once a value is chosen', () => {
    wrapper = mount(VSelect, {
      props: { options: FRUITS, name: 'fruit', required: true, modelValue: 'Apple' },
      attachTo: document.body,
    })
    const invalid = wrapper
      .findAll('input')
      .filter((i) => !(i.element as HTMLInputElement).checkValidity())
    expect(invalid).toHaveLength(0)
  })
})

describe('useOptionFilter', () => {
  // `filter` was read once during setup, so the computed closed over the
  // setup-time function forever — a UI that swaps matching strategy at runtime
  // silently kept the first one. Every neighbouring option was already reactive.
  it('picks up a filter swapped at runtime', () => {
    const options = ref(
      ['Banana', 'Blueberry', 'Crab'].map((label, i) => ({
        id: `o${i}`,
        value: label,
        label,
        raw: label,
      })),
    )
    const startsWith: FilterFn<string> = ({ query, option }) =>
      option.label.toLowerCase().startsWith(query.toLowerCase())
    const endsWith: FilterFn<string> = ({ query, option }) =>
      option.label.toLowerCase().endsWith(query.toLowerCase())

    const filterRef = ref<FilterFn<string>>(startsWith)
    const { filtered } = useOptionFilter<string>({
      options,
      query: ref('b'),
      filter: computed(() => filterRef.value),
      caseSensitive: ref(false),
    })

    expect(filtered.value.map((o) => o.label)).toEqual(['Banana', 'Blueberry'])
    filterRef.value = endsWith
    expect(filtered.value.map((o) => o.label)).toEqual(['Crab'])
  })
})
