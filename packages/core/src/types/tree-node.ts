import type { OptionAccessor } from '@/types/option'

/**
 * Shape every tree input is normalised into. Mirrors `NormalizedOption` for
 * flat lists, with depth + parent + children added so the renderer can draw
 * the hierarchy without recomputing on every paint.
 */
export interface NormalizedTreeNode<T = unknown> {
  /** Stable key — used by Vue's v-for and aria. */
  id: string
  /** The value emitted via v-model when this node is a leaf. */
  value: unknown
  /** Display label. */
  label: string
  /** 0 for top-level, increments per level of nesting. */
  depth: number
  /** Reference to the parent's `id`, or null at the top level. */
  parentId: string | null
  /** A leaf has no children; only leaves are toggled into v-model. */
  isLeaf: boolean
  /** Disabled nodes render but cannot be toggled. */
  disabled: boolean
  /** Recursively normalised children. */
  children: NormalizedTreeNode<T>[]
  /** Original input as supplied by the caller. */
  raw: T
}

/**
 * The widest type a tree input can be. Plain `object` so consumer interfaces
 * (which lack an index signature and therefore can't satisfy
 * `Record<string, unknown>`) are still assignable, without resorting to `any`.
 * The accessors cast through `Readonly<Record<string, unknown>>` internally
 * whenever they need to read a property by name.
 */
export type TreeOptionLike = object

/**
 * Accessor for the children array on a tree input. Default: `'children'`.
 */
export type TreeChildrenAccessor<T> = OptionAccessor<T, T[] | undefined>

/** Tri-state used to drive the parent checkbox visual. */
export type TreeNodeCheckState = 'unchecked' | 'indeterminate' | 'checked'
