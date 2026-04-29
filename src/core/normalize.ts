import type { NormalizedOption, OptionAccessor, OptionLike } from '@/types/option'
import { isPrimitive, readAccessor } from '@/core/accessor'

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
        raw: option as T,
      }
    }
    const value = readAccessor(
      option,
      config.optionValue,
      (option as Record<string, unknown>).value,
    )
    const label = readAccessor(
      option,
      config.optionLabel,
      String((option as Record<string, unknown>).label ?? value ?? ''),
    )
    const group = readAccessor(option, config.optionGroup, undefined)
    const disabled = readAccessor(
      option,
      config.optionDisabled,
      Boolean((option as Record<string, unknown>).disabled),
    )
    return {
      id: `opt-${index}-${String(value)}`,
      value,
      label: String(label),
      group: group as string | undefined,
      disabled: Boolean(disabled),
      raw: option,
    }
  })
}
