import { computed, type ComputedRef, type Ref } from 'vue'
import { devWarn } from '@anil-labs/select-core'

export interface UseFormBindingOptions {
  /**
   * Form field name. When unset the composable returns no inputs  form
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
  if (typeof value === 'object') {
    // `hiddenInputs` is a computed read during render, so an unguarded throw
    // here took the whole component down  and only when `name` was set, so
    // adding native-form support to a working select is what broke it.
    // Circular object values are ordinary in ORM-shaped data
    // (`employee.manager.reports[0] === employee`), and object values are
    // documented as supported.
    try {
      // JSON.stringify returns undefined for some inputs (a bare function,
      // a symbol), independently of throwing  hence the ?? as well.
      return JSON.stringify(value) ?? ''
    } catch {
      devWarn(
        '[select-vue] useFormBinding: a selected value could not be serialised ' +
          'for its hidden input (circular reference?). Submitting an empty string ' +
          'for it. Pass a primitive `optionValue` if this field is posted to a server.',
      )
      return ''
    }
  }
  // False positive, verified during the audit: the `typeof value === 'object'`
  // branch above returns for every object, so `value` here is only ever a
  // primitive and can never stringify to "[object Object]". The rule cannot
  // see through the early return.
  //
  // Keep this directive on the line directly above the return  Prettier
  // reflows a long trailing `--` reason onto following lines, which silently
  // moves the directive off its target.
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return String(value)
}

/**
 * Centralises the native-form integration shared by `<VSelect>` and
 * `<VTreeSelect>`. The component is left to render the inputs (it owns the
 * DOM tree); this composable just owns the *shape*  names, multi-suffixing,
 * and the empty-state-with-required edge case.
 */
export function useFormBinding(opts: UseFormBindingOptions): UseFormBindingReturn {
  const hiddenInputs = computed<readonly FormHiddenInput[]>(() => {
    const name = opts.name.value
    if (!name) return []
    const fieldName = opts.isMulti.value ? `${name}[]` : name
    if (opts.values.value.length === 0) {
      // One empty placeholder so the field still appears in FormData.
      //
      // `fieldName`, NOT `name`: this branch used the unsuffixed name, so the
      // FormData key flipped between `skills[]` and `skills` depending on how
      // many items were selected. The documented read path
      // (`data.getAll('skills[]')`) returned nothing precisely on the request
      // where the user had deselected everything  the request most likely to
      // hit a server-side validation branch expecting an array.
      return [{ name: fieldName, value: '', required: opts.required.value }]
    }
    return opts.values.value.map((v) => ({
      name: fieldName,
      value: stringifyValue(v),
      required: false,
    }))
  })

  return { hiddenInputs }
}
