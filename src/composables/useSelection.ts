import { computed, type ComputedRef, type Ref } from 'vue'
import type { NormalizedOption, SelectMode } from '@/types/option'

export interface UseSelectionOptions<T> {
  modelValue: Ref<unknown>
  options: Ref<NormalizedOption<T>[]>
  mode: Ref<SelectMode>
  maxSelections?: Ref<number | undefined>
  emitUpdate: (value: unknown) => void
  emitSelect: (option: NormalizedOption<T>) => void
  emitDeselect: (option: NormalizedOption<T>) => void
}

export interface UseSelectionReturn<T> {
  isMulti: ComputedRef<boolean>
  selectedValues: ComputedRef<unknown[]>
  selectedOptions: ComputedRef<NormalizedOption<T>[]>
  isSelected: (option: NormalizedOption<T>) => boolean
  select: (option: NormalizedOption<T>) => void
  deselect: (option: NormalizedOption<T>) => void
  clear: () => void
}

/**
 * Selection state machine. Owns *only* selection — translating between the
 * v-model shape (one value vs an array) and the list of selected normalised
 * options the UI renders. Open/close + activeIndex live in `useMenuState`
 * so callers building headless variants can compose the two independently.
 *
 * We resolve selections against the option list so that, for object options,
 * the rendered selection survives a referential refresh of the same value
 * (e.g. async option list reloads).
 */
export function useSelection<T>(opts: UseSelectionOptions<T>): UseSelectionReturn<T> {
  const isMulti = computed(() => opts.mode.value !== 'single')

  const selectedValues = computed<unknown[]>(() => {
    const value = opts.modelValue.value
    if (value == null || value === '') return []
    return Array.isArray(value) ? value : [value]
  })

  // Set lookup keeps `isSelected` (called once per option per render) at O(1)
  // average. Object values still match by reference because Set uses
  // SameValueZero, which behaves identically to `===` for non-NaN values.
  const selectedSet = computed(() => new Set(selectedValues.value))

  // Index options by value so `selectedOptions` can resolve labels in O(n)
  // total instead of O(n × m) — important when both the option list and the
  // selected list grow.
  const optionByValue = computed(() => {
    const map = new Map<unknown, NormalizedOption<T>>()
    for (const option of opts.options.value) map.set(option.value, option)
    return map
  })

  /**
   * If a value has no matching option (common during async loading) we
   * synthesise a placeholder so the chip/label still renders.
   */
  const selectedOptions = computed<NormalizedOption<T>[]>(() => {
    const lookup = optionByValue.value
    return selectedValues.value.map((v) => {
      const found = lookup.get(v)
      if (found) return found
      const label =
        typeof v === 'object' && v !== null
          ? String(
              (v as Record<string, unknown>).label ?? (v as Record<string, unknown>).name ?? '',
            )
          : String(v)
      return {
        id: `synthetic-${label}`,
        value: v,
        label,
        raw: v as T,
      } satisfies NormalizedOption<T>
    })
  })

  function isSelected(option: NormalizedOption<T>): boolean {
    return selectedSet.value.has(option.value)
  }

  function select(option: NormalizedOption<T>) {
    if (option.disabled) return
    const wasSelected = isSelected(option)
    if (!isMulti.value) {
      if (wasSelected) return
      opts.emitUpdate(option.value)
      opts.emitSelect(option)
      return
    }
    const cap = opts.maxSelections?.value
    if (!wasSelected && cap !== undefined && selectedValues.value.length >= cap) return
    const current = selectedValues.value
    const next = wasSelected
      ? current.filter((v) => v !== option.value)
      : [...current, option.value]
    opts.emitUpdate(next)
    if (wasSelected) opts.emitDeselect(option)
    else opts.emitSelect(option)
  }

  function deselect(option: NormalizedOption<T>) {
    if (!isMulti.value) {
      opts.emitUpdate(null)
    } else {
      opts.emitUpdate(selectedValues.value.filter((v) => v !== option.value))
    }
    opts.emitDeselect(option)
  }

  function clear() {
    if (selectedValues.value.length === 0) return
    const cleared = selectedOptions.value.slice()
    opts.emitUpdate(isMulti.value ? [] : null)
    for (const option of cleared) opts.emitDeselect(option)
  }

  return {
    isMulti,
    selectedValues,
    selectedOptions,
    isSelected,
    select,
    deselect,
    clear,
  }
}
