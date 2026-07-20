import { computed, unref, type ComputedRef, type MaybeRef, type Ref } from 'vue'
import type { FilterFn } from '@anil-labs/select-core'
import type { NormalizedOption } from '@anil-labs/select-core'
import { defaultFilter } from '@anil-labs/select-core'

export interface UseOptionFilterOptions<T> {
  options: Ref<NormalizedOption<T>[]>
  query: Ref<string>
  // MaybeRef, not a bare value: read once during setup, the computed below
  // closed over the setup-time function forever, so a UI that swaps matching
  // strategy at runtime (fuzzy vs exact, by-code vs by-name) silently kept
  // the first filter for the component's lifetime. Every neighbouring option
  // here is already reactive, including `caseSensitive` on the next line.
  filter?: MaybeRef<FilterFn<T> | undefined>
  caseSensitive?: Ref<boolean>
}

/**
 * Filters the option list against the active search query. Returns the
 * filtered list plus a `hasMatches` flag — useful for menu empty states and
 * the "Create '<query>'" row when `taggable` is on.
 */
export function useOptionFilter<T>(opts: UseOptionFilterOptions<T>): {
  filtered: ComputedRef<NormalizedOption<T>[]>
  hasMatches: ComputedRef<boolean>
} {
  const filtered = computed(() => {
    const query = opts.query.value.trim()
    if (!query) return opts.options.value
    const fn = unref(opts.filter)
    const cs = opts.caseSensitive?.value ?? false
    return opts.options.value.filter((option) =>
      fn ? fn({ query, option }) : defaultFilter(query, option, cs),
    )
  })

  const hasMatches = computed(() => filtered.value.length > 0)

  return { filtered, hasMatches }
}
