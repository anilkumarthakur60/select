import { computed, type ComputedRef, type Ref } from 'vue'

export interface UseFormBindingOptions {
  /**
   * Form field name. When unset the composable returns no inputs — form
   * integration is opt-in. For multi-select the rendered `name` becomes
   * `${name}[]` so PHP / Rails-style array parsers see all values.
   */
  name: Ref<string | undefined>
  /** Marks the empty-state hidden input as required. Ignored when values exist. */
  required: Ref<boolean>
  /** The currently-selected raw values (one entry per hidden input). */
  values: Ref<readonly unknown[]>
  /** Drives the `[]` suffix on the rendered name. */
  isMulti: Ref<boolean>
}

/** One-per-input descriptor consumers map straight onto an `<input type="hidden">`. */
export interface FormHiddenInput {
  name: string
  value: string
  required: boolean
}

export interface UseFormBindingReturn {
  /**
   * The hidden inputs the component should render under the trigger. Empty
   * when `name` is unset. When the selection is empty *and* `name` is set we
   * still emit a single empty input so the field appears in the FormData.
   */
  hiddenInputs: ComputedRef<readonly FormHiddenInput[]>
}

function stringifyValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * Centralises the native-form integration shared by `<VSelect>` and
 * `<VTreeSelect>`. The component is left to render the inputs (it owns the
 * DOM tree); this composable just owns the *shape* — names, multi-suffixing,
 * and the empty-state-with-required edge case.
 */
export function useFormBinding(opts: UseFormBindingOptions): UseFormBindingReturn {
  const hiddenInputs = computed<readonly FormHiddenInput[]>(() => {
    const name = opts.name.value
    if (!name) return []
    const fieldName = opts.isMulti.value ? `${name}[]` : name
    if (opts.values.value.length === 0) {
      // One empty placeholder so the field still appears in FormData and the
      // browser's native `required` validation has something to check.
      return [{ name, value: '', required: opts.required.value }]
    }
    return opts.values.value.map((v) => ({
      name: fieldName,
      value: stringifyValue(v),
      required: false,
    }))
  })

  return { hiddenInputs }
}
