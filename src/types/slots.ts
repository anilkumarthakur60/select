import type { NormalizedOption } from '@/types/option'
import type { NormalizedTreeNode } from '@/types/tree-node'

export interface OptionSlotProps<T = unknown> {
  option: NormalizedOption<T>
  selected: boolean
  active: boolean
  disabled: boolean
}

/** Per-tag rendering in multi/tags mode. Default: `<VSelectTag />`. */
export interface TagSlotProps<T = unknown> {
  option: NormalizedOption<T>
  remove: () => void
  disabled: boolean
}

/** Whole-value rendering. Default: tags in multi mode, single label otherwise. */
export interface ValueSlotProps<T = unknown> {
  selected: NormalizedOption<T>[]
  isMulti: boolean
}

export interface OptionGroupSlotProps {
  group: string
}

/** Empty state slot — `mode` distinguishes "no options at all" from "no match". */
export interface EmptySlotProps {
  query: string
  mode: 'no-options' | 'no-results'
}

export interface CreateSlotProps {
  query: string
  create: () => void
}

export interface ClearIconSlotProps {
  clear: () => void
}

export interface DropdownIconSlotProps {
  open: boolean
}

export interface LoaderSlotProps {
  /** Whether the loader appears inside the menu (true) or in the control (false). */
  inMenu: boolean
}

/** Aggregate map of every slot `<VSelect>` exposes — useful for typing wrappers. */
export interface VSelectSlots<T = unknown> {
  prefix?: () => unknown
  suffix?: () => unknown
  tag?: (props: TagSlotProps<T>) => unknown
  value?: (props: ValueSlotProps<T>) => unknown
  option?: (props: OptionSlotProps<T>) => unknown
  optiongroup?: (props: OptionGroupSlotProps) => unknown
  empty?: (props: EmptySlotProps) => unknown
  loader?: (props: LoaderSlotProps) => unknown
  dropdownicon?: (props: DropdownIconSlotProps) => unknown
  clearicon?: (props: ClearIconSlotProps) => unknown
  create?: (props: CreateSlotProps) => unknown
}

export interface TreeTagSlotProps<T = unknown> {
  node: NormalizedTreeNode<T>
  remove: () => void
  disabled: boolean
}

export interface TreeValueSlotProps<T = unknown> {
  selected: NormalizedTreeNode<T>[]
}

export interface TreeToolbarSlotProps {
  selectAll: () => void
  clear: () => void
  /** Expand every parent node in the tree. */
  expandAll: () => void
  /** Collapse every parent node in the tree. */
  collapseAll: () => void
  /** True when every parent in the full tree is currently expanded. */
  allExpanded: boolean
  selectedCount: number
}

export interface TreeEmptySlotProps {
  query: string
  mode: 'no-options' | 'no-results'
}

/** Aggregate map of every slot `<VTreeSelect>` exposes. */
export interface VTreeSelectSlots<T = unknown> {
  prefix?: () => unknown
  suffix?: () => unknown
  tag?: (props: TreeTagSlotProps<T>) => unknown
  value?: (props: TreeValueSlotProps<T>) => unknown
  toolbar?: (props: TreeToolbarSlotProps) => unknown
  empty?: (props: TreeEmptySlotProps) => unknown
  dropdownicon?: (props: DropdownIconSlotProps) => unknown
  clearicon?: (props: ClearIconSlotProps) => unknown
}
