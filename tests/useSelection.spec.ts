import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { useSelection } from '@/composables/useSelection'
import { normalize } from '@/core/normalize'

function setup(initial: unknown, mode: 'single' | 'multiple' | 'tags' = 'single') {
  const modelValue = ref<unknown>(initial)
  const options = ref(normalize(['Apple', 'Banana', 'Cherry'], {}))
  const emitUpdate = vi.fn((v: unknown) => (modelValue.value = v))
  const emitSelect = vi.fn()
  const emitDeselect = vi.fn()

  const api = useSelection({
    modelValue,
    options,
    mode: ref(mode),
    emitUpdate,
    emitSelect,
    emitDeselect,
  })

  return { ...api, options, modelValue, emitUpdate, emitSelect, emitDeselect }
}

describe('useSelection — single mode', () => {
  it('selects a value and emits update + select', () => {
    const { select, options, emitUpdate, emitSelect } = setup(null)
    select(options.value[0]!)
    expect(emitUpdate).toHaveBeenCalledWith('Apple')
    expect(emitSelect).toHaveBeenCalledTimes(1)
  })

  it('does not re-emit when picking the already-selected option', () => {
    const { select, options, emitUpdate } = setup('Apple')
    select(options.value[0]!)
    expect(emitUpdate).not.toHaveBeenCalled()
  })

  it('clears to null', () => {
    const { clear, emitUpdate } = setup('Apple')
    clear()
    expect(emitUpdate).toHaveBeenCalledWith(null)
  })

  it('refuses to select disabled options', () => {
    const { select, options, emitUpdate } = setup(null)
    options.value[0]!.disabled = true
    select(options.value[0]!)
    expect(emitUpdate).not.toHaveBeenCalled()
  })
})

describe('useSelection — multiple mode', () => {
  it('toggles values into an array', () => {
    const { select, options, emitUpdate } = setup([], 'multiple')
    select(options.value[0]!)
    expect(emitUpdate).toHaveBeenLastCalledWith(['Apple'])
  })

  it('emits deselect when re-picking a selected value', () => {
    const { select, options, emitDeselect } = setup(['Apple'], 'multiple')
    select(options.value[0]!)
    expect(emitDeselect).toHaveBeenCalledTimes(1)
  })

  it('respects maxSelections', () => {
    const modelValue = ref<unknown>(['Apple', 'Banana'])
    const options = ref(normalize(['Apple', 'Banana', 'Cherry'], {}))
    const emitUpdate = vi.fn()
    const { select } = useSelection({
      modelValue,
      options,
      mode: ref<'multiple'>('multiple'),
      maxSelections: computed(() => 2),
      emitUpdate,
      emitSelect: vi.fn(),
      emitDeselect: vi.fn(),
    })
    select(options.value[2]!)
    expect(emitUpdate).not.toHaveBeenCalled()
  })
})
