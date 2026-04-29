import type { OptionAccessor } from '@/types/option'

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
  if (typeof accessor === 'function') return (accessor as (o: T) => R)(option)
  const value = (option as Record<string, unknown>)[accessor as string]
  return (value === undefined ? fallback : value) as R
}

export function isPrimitive(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}
