import { getCurrentInstance } from 'vue'
import * as vue from 'vue'

let counter = 0

// Namespace import, not `import { useId }`: the peer range starts at Vue 3.3
// and `useId` only exists from 3.5, so a named import would fail to resolve at
// module load on the lower half of the supported range.
const vueUseId = (vue as { useId?: () => string }).useId

/**
 * Stable per-instance id, used for `aria-controls` / `aria-activedescendant`
 * and the search input's `id`.
 *
 * Prefers Vue 3.5's `useId()`, which is hydration-stable by construction.
 *
 * The previous implementation used `instance.uid`, a module-level counter over
 * *every* component instance in the process. On a long-lived SSR server that
 * keeps climbing across requests while the client's counter restarts at zero,
 * so server and client disagreed  two consecutive server renders already
 * disagreed with each other. Vue does not repair mismatched attributes, so
 * after hydration the DOM kept the server's `aria-controls` while the menu
 * (rendered client-side on open) got the client's id: the combobox→listbox
 * relationship was silently broken for assistive tech in production, where the
 * hydration warning is compiled out. This package ships a Nuxt module, so SSR
 * is a first-class path.
 *
 * The `uid` fallback remains for Vue 3.3/3.4, where it is the best available 
 * those versions have no hydration-stable id primitive. Consumers on <3.5 who
 * need SSR-stable ids should pass an explicit `id` prop.
 */
export function useStableId(prefix = 'vs'): string {
  const instance = getCurrentInstance()
  if (instance) {
    if (vueUseId) {
      const id = vueUseId()
      if (id) return `${prefix}-${id}`
    }
    return `${prefix}-${instance.uid}`
  }
  counter += 1
  return `${prefix}-anon-${counter}`
}
