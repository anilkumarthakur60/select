/**
 * Compares two values for selection purposes. Object identity by reference —
 * structural equality is intentionally out of scope so consumers control how
 * values flow through v-model (use a primitive id + accessor instead).
 */
export function valuesEqual(a: unknown, b: unknown): boolean {
  return a === b
}

/**
 * Toggles `value` inside `current` (multi-mode). Returns a new array — never
 * mutates input — so v-model emits trigger reactivity cleanly.
 */
export function toggleValue(current: unknown[], value: unknown): unknown[] {
  const index = current.indexOf(value)
  if (index === -1) return [...current, value]
  const next = current.slice()
  next.splice(index, 1)
  return next
}
