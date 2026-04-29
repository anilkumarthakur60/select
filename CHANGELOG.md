# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-04-26

### Added

- Initial release of `<VSelect>` with single, multiple, and tags modes.
- Generic `<T>` component — typed accessors for `optionValue` / `optionLabel` /
  `optionGroup` / `optionDisabled`.
- Searchable input with custom `filter` prop and `caseSensitive` mode.
- Async support: `@search` event + `:loading` prop.
- Grouped options via `optionGroup`.
- Floating-UI menu positioning with collision flip/shift and width matching.
- Optional `teleportTo` for body-mounted menus.
- ARIA-1.2 combobox + listbox semantics.
- Keyboard navigation: ↑/↓, Home, End, Enter, Esc, Tab, Backspace.
- Slot API: `prefix`, `suffix`, `tag`, `value`, `option`, `optiongroup`,
  `empty` (with `mode: 'no-options' | 'no-results'`), `loader`,
  `dropdownicon`, `clearicon`, `create`.
- Native form integration via `name` prop (hidden inputs in FormData).
- Themeable via CSS custom properties (`--vselect-*` namespace) — light, dark,
  and `auto` themes. Stylesheet wrapped in `@layer vselect` so consumer
  overrides win without specificity wars.
- Accent presets: emerald, rose (SCSS subpath imports).
- `<VTreeSelect>` for hierarchical pickers — tri-state parents derived from
  leaf v-model, search auto-expansion, optional "select all" toolbar, and a
  matching `useTreeSelection` headless composable.
- `useDebounced` composable powering the debounced `search` / filter pipeline
  in both `<VSelect>` and `<VTreeSelect>`, with `flush()`, `cancel()`, and
  `force(value)` escape hatches for async pickers.
- Headless composables: `useSelection`, `useTreeSelection`, `useOptionFilter`,
  `useKeyboardNav`, `useStableId`, `useDebounced`, `useFloatingMenu`,
  `useOutsideClick`, `useControlFocus` — the same primitives the SFCs use,
  exposed for consumers building custom variants.
- Core helpers: `normalize`, `defaultFilter`, `toggleValue`, `valuesEqual`,
  `escapeRegex`, `readAccessor`, `isPrimitive`, `normalizeTree`, `walkTree`,
  `flattenTree`, `filterTree`, `getLeafValues`, `getAncestorIds`.
- Three sizes: `sm` / `md` / `lg`.
- Optional Vue plugin (`VueSelectPlugin`) for global registration of both
  `<VSelect>` and `<VTreeSelect>`.
- First-class Nuxt 3 / 4 module at `vue3-select/nuxt` — auto-registers the
  components, optionally auto-imports the composables, and injects the
  prebuilt stylesheet. `@nuxt/kit` and `nuxt` are declared as **optional**
  peer dependencies so non-Nuxt users incur no install cost.
