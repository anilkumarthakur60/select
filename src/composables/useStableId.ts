import { getCurrentInstance } from 'vue'

let counter = 0

/**
 * Stable per-instance id. We intentionally don't reuse Vue 3.5's built-in
 * `useId` so this composable keeps working under our `^3.3` peer range.
 * Falls back to a monotonic counter outside a component (tests).
 */
export function useStableId(prefix = 'vs'): string {
  const instance = getCurrentInstance()
  if (instance) return `${prefix}-${instance.uid}`
  counter += 1
  return `${prefix}-anon-${counter}`
}
