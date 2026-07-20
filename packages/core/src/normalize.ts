import type { NormalizedOption, OptionAccessor, OptionLike } from '@/types/option'
import { isPrimitive, readAccessor, safeLabel } from '@/accessor'

interface NormalizeConfig<T> {
  optionValue?: OptionAccessor<T, unknown>
  optionLabel?: OptionAccessor<T, string>
  optionGroup?: OptionAccessor<T, string | undefined>
  optionDisabled?: OptionAccessor<T, boolean>
}

/**
 * Normalises a heterogeneous option list. Primitives become `{ value, label }`
 * pairs; objects are passed through with the configured accessors. Group
 * keys are preserved so the menu renderer can collapse them into headings.
 */
export function normalize<T extends OptionLike>(
  options: readonly T[],
  config: NormalizeConfig<T>,
): NormalizedOption<T>[] {
  return options.map((option, index) => {
    if (isPrimitive(option)) {
      const str = String(option)
      return {
        id: `opt-${index}-${str}`,
        value: option,
        label: str,
        raw: option,
      }
    }
    const value = readAccessor(
      option,
      config.optionValue,
      (option as Record<string, unknown>).value,
    )
    // Resolve the label WITHOUT coercing, then coerce through safeLabel — the
    // old `String(option.label ?? value ?? '')` rendered "[object Object]" for
    // an i18n-shaped label and made the row unsearchable, since `label` is the
    // only field the filter matches against.
    const rawLabel = readAccessor<T, unknown>(
      option,
      config.optionLabel,
      (option as Record<string, unknown>).label ?? value,
    )
    const label = safeLabel(rawLabel, value, 'normalize')
    const group = readAccessor(option, config.optionGroup, undefined)
    const disabled = readAccessor(
      option,
      config.optionDisabled,
      Boolean((option as Record<string, unknown>).disabled),
    )
    return {
      // The index already makes the id unique, so a non-primitive value
      // contributes nothing but "[object Object]" — and this id is
      // interpolated into DOM attributes downstream.
      id: isPrimitive(value) ? `opt-${index}-${String(value)}` : `opt-${index}`,
      value,
      label,
      group: group,
      disabled: Boolean(disabled),
      raw: option,
    }
  })
}
