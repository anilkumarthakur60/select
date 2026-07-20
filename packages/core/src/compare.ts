/**
 * Compares two values for selection purposes. Object identity by reference —
 * structural equality is intentionally out of scope so consumers control how
 * values flow through v-model (use a primitive id + accessor instead).
 *
 * The relation is **SameValueZero**, deliberately: `Set` and `Map` are what the
 * machine uses for its "is this option selected" lookups, and they compare with
 * SameValueZero. Strict `===` disagreed with them on `NaN`, and that made
 * selection a one-way door — `isSelected` reported true (via `Set.has`) so a
 * click took the deselect branch, but the removal `filter(v => v !== value)`
 * matched nothing, so `onDeselect` fired on every click while the value stayed
 * selected forever. One relation, used everywhere, is the fix.
 *
 * Note this treats `+0` and `-0` as equal, which is what `Set` already did.
 */
export function valuesEqual(a: unknown, b: unknown): boolean {
  // SameValueZero: `===` plus NaN-equals-NaN.
  return a === b || (a !== a && b !== b)
}

/** Index of `value` in `current` under {@link valuesEqual}, or -1. */
export function indexOfValue(current: readonly unknown[], value: unknown): number {
  return current.findIndex((v) => valuesEqual(v, value))
}

/**
 * Toggles `value` inside `current` (multi-mode). Returns a new array — never
 * mutates input — so v-model emits trigger reactivity cleanly.
 */
export function toggleValue(current: unknown[], value: unknown): unknown[] {
  // `indexOf` here used strict equality, so `toggleValue([NaN], NaN)` returned
  // `[NaN, NaN]` — a "toggle" that grew the array and disagreed with the
  // machine's own `isSelected` for the same input.
  const index = indexOfValue(current, value)
  if (index === -1) return [...current, value]
  const next = current.slice()
  next.splice(index, 1)
  return next
}
