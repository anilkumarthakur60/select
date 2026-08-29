import type { OptionAccessor } from '@/types/option'
import { devWarn } from '@/warn'

/**
 * Reads a property or computes a derived value. Accepts a string key OR a
 * function so callers can stay terse for object options without losing
 * access to deep paths or computed labels.
 */
export function readAccessor<T, R>(
  option: T,
  accessor: OptionAccessor<T, R> | undefined,
  fallback: R,
): R {
  if (accessor === undefined) return fallback
  if (typeof accessor === 'function') return accessor(option)
  const value = (option as Record<string, unknown>)[accessor as string]
  return (value === undefined ? fallback : value) as R
}

export function isPrimitive(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

/**
 * Coerces a resolved label to a string, and never produces "[object Object]".
 *
 * A bare `String(x)` on a non-primitive silently renders "[object Object]" as
 * the row text, the collapsed control's accessible name, the tag text and the
 * remove button's `aria-label`  and, because `label` is the only field search
 * matches against, makes the option unreachable by typing. An i18n-shaped
 * label (`{ en: 'Apple', fr: 'Pomme' }`) is the realistic way to hit it.
 *
 * So: primitives stringify, a non-primitive falls back to the option's value
 * and warns once telling the caller to supply an `optionLabel` accessor. An
 * empty string is the last resort  callers that need a non-empty accessible
 * name must handle that case themselves.
 */
export function safeLabel(raw: unknown, fallback: unknown, where: string): string {
  if (isPrimitive(raw)) return String(raw)
  if (raw != null) {
    devWarn(
      `[select-core] ${where}: label resolved to type "${Array.isArray(raw) ? 'array' : typeof raw}", ` +
        `not a string. Pass an \`optionLabel\` accessor that returns a string. ` +
        `Falling back to the option value.`,
    )
  }
  if (isPrimitive(fallback)) return String(fallback)
  return ''
}
