export { readAccessor, isPrimitive, safeLabel } from '@/accessor'
// Shared by the adapters so every package warns through one deduped registry —
// these fire from render paths, so an undeduped warning prints once per frame.
export { devWarn, resetWarnings } from '@/warn'
export { normalize } from '@/normalize'
export { valuesEqual, toggleValue } from '@/compare'
export { defaultFilter, escapeRegex } from '@/filter'
export {
  normalizeTree,
  walkTree,
  flattenTree,
  filterTree,
  getLeafValues,
  getAncestorIds,
} from '@/tree'

export type {
  NormalizedOption,
  OptionLike,
  OptionAccessor,
  SelectMode,
  SelectSize,
  SelectTheme,
  FilterFn,
  FilterContext,
  NormalizedTreeNode,
  TreeOptionLike,
  TreeChildrenAccessor,
  TreeNodeCheckState,
} from '@/types'

export { createSelectMachine } from '@/machine'
export type {
  SelectMachine,
  SelectMachineConfig,
  SelectState,
  RootProps,
  ControlProps,
  MenuProps,
  SearchProps,
  OptionProps,
  // Adapters build the clear/reset button from this. It was reachable only via
  // a deep `core/machine` import while everything lived in one package, so
  // splitting the packages makes it genuinely public surface.
  ClearButtonProps,
} from '@/machine'
