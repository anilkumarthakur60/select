/**
 * Internal shape every option is normalised into. Consumers may pass
 * primitives (string/number) or arbitrary objects — the component reads
 * identity via `optionValue` and label via `optionLabel`, then keeps a
 * reference to the original raw option on `raw`.
 */
export interface NormalizedOption<T = unknown> {
  /** Stable, unique key used by Vue's v-for and aria. */
  id: string
  /** The value emitted via v-model. */
  value: unknown
  /** Display label. */
  label: string
  /** Optional group key — options sharing a key render under the same heading. */
  group?: string
  /** Disabled options are visible but not selectable. */
  disabled?: boolean
  /** The original option as supplied by the caller. */
  raw: T
}

/**
 * The widest type we accept as an option. We use plain `object` so consumer
 * interfaces (which lack an index signature and therefore can't satisfy
 * `Record<string, unknown>`) are still assignable, without falling back to
 * `any`. Internally the accessors cast through `Readonly<Record<string,
 * unknown>>` whenever they need to read a property by name.
 */
export type OptionLike = string | number | object

/** Resolves either a property name on the option or an extractor function. */
export type OptionAccessor<T, R> = keyof T | ((option: T) => R)

export type SelectMode = 'single' | 'multiple' | 'tags'

export type SelectSize = 'sm' | 'md' | 'lg'

export type SelectTheme = 'light' | 'dark' | 'auto'
