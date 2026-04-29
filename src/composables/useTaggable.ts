import { computed, type ComputedRef, type Ref } from 'vue'
import type { NormalizedOption } from '@/types/option'

export interface UseTaggableOptions<T> {
  /**
   * Whether taggable mode is active. Combine `props.taggable` with
   * `mode === 'tags'` upstream — this composable doesn't peek at mode.
   */
  enabled: Ref<boolean>
  /** Live (non-debounced) query value. */
  query: Ref<string>
  /** Filtered option list — used to suppress the create-row when the query already matches. */
  filtered: Ref<readonly NormalizedOption<T>[]>
  /** Fired when the user accepts the create suggestion. Receives the trimmed query. */
  onCreate: (value: string) => void
}

export interface UseTaggableReturn {
  /**
   * `true` when a "Create '<query>'" row should appear in the menu — i.e. the
   * query is non-empty and no existing option's label matches it (case-insensitive).
   */
  showCreate: ComputedRef<boolean>
  /** Trim the query, fire `onCreate`, and let the caller reset state. */
  createFromQuery: () => void
}

/**
 * Encapsulates the "create from query" affordance used by `<VSelect>` in
 * tags mode. Pulled out so the rendering component stays focused on the DOM
 * and so headless consumers (e.g. a custom command-palette UI) can reuse the
 * same predicate without copy-pasting the suppression rules.
 */
export function useTaggable<T>(opts: UseTaggableOptions<T>): UseTaggableReturn {
  const showCreate = computed(() => {
    if (!opts.enabled.value) return false
    const q = opts.query.value.trim()
    if (!q) return false
    const needle = q.toLowerCase()
    return !opts.filtered.value.some((o) => o.label.toLowerCase() === needle)
  })

  function createFromQuery() {
    const q = opts.query.value.trim()
    if (!q) return
    opts.onCreate(q)
  }

  return { showCreate, createFromQuery }
}
