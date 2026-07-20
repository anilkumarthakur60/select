const seen = new Set<string>()

function isProduction(): boolean {
  // `process` does not exist in a plain browser bundle, and bundlers replace
  // `process.env.NODE_ENV` textually — so this has to survive both the
  // substituted and the entirely-absent case.
  try {
    return typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'
  } catch {
    return false
  }
}

/**
 * Dev-only warning, emitted at most once per distinct message.
 *
 * The dedupe is not a nicety: `normalize()` and `normalizeTree()` re-run on
 * every render, so a warning about a malformed option would otherwise print
 * once per option per frame and bury everything else in the console.
 */
export function devWarn(message: string): void {
  if (isProduction()) return
  if (seen.has(message)) return
  seen.add(message)
  console.warn(message)
}

/** Test-only: lets a suite assert on the first warning of a given message. */
export function resetWarnings(): void {
  seen.clear()
}
