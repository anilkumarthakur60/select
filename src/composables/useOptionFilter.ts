import { computed, type ComputedRef, type Ref } from 'vue'
import type { FilterFn } from '@/types/filter'
import type { NormalizedOption } from '@/types/option'
import { defaultFilter } from '@/core/filter'

export interface UseOptionFilterOptions<T> {
  options: Ref<NormalizedOption<T>[]>
  query: Ref<string>
  filter?: FilterFn<T>
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
    const fn = opts.filter
    const cs = opts.caseSensitive?.value ?? false
    return opts.options.value.filter((option) =>
      fn ? fn({ query, option }) : defaultFilter(query, option, cs),
    )
  })

  const hasMatches = computed(() => filtered.value.length > 0)

  return { filtered, hasMatches }
}
