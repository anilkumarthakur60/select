import type { NormalizedOption } from '@/types/option'

export interface FilterContext<T> {
  query: string
  option: NormalizedOption<T>
}

/** Returns true if the option matches the active query. */
export type FilterFn<T = unknown> = (ctx: FilterContext<T>) => boolean
