import type { NormalizedOption } from '@/types/option'

/**
 * Default substring matcher. We intentionally don't ship a fuzzy ranker by
 * default — most consumers want "label contains query", and shipping a 4kb
 * fuzzy library would surprise people. Pass a custom `filter` prop for fuzzy.
 */
export function defaultFilter<T>(
  query: string,
  option: NormalizedOption<T>,
  caseSensitive = false,
): boolean {
  if (!query) return true
  const haystack = caseSensitive ? option.label : option.label.toLowerCase()
  const needle = caseSensitive ? query : query.toLowerCase()
  return haystack.includes(needle)
}

/** Escape a string so it can be embedded as a literal inside a regex. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
