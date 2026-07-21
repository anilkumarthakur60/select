# @anil-labs/select-vue

## 0.1.0

### Minor Changes

- 4b7b45e: Drop the `@floating-ui/vue` dependency — menu positioning is now implemented
  in-house. `@anil-labs/select-vue` has no runtime dependency other than
  `@anil-labs/select-core`.

  The library was only used to position the menu when `teleport-to` is set, which
  is **opt-in and off by default**. It cost consumers ~7.6 KB gzipped after
  tree-shaking, plus three transitive packages in the lockfile.

  More importantly, `useFloating()` was called _unconditionally_ — the teleport
  check only gated whether the resulting styles were applied. A
  default-configured `<VSelect>` therefore constructed a `ResizeObserver`,
  attached four window scroll/resize listeners, computed a position, and then
  discarded it. That is now zero observers and zero listeners unless the menu is
  actually teleported.

  Positioning behaviour is unchanged: a 6px offset, flipping above when there is
  no room below, clamping inside the viewport with 8px padding, and a `minWidth`
  matched to the control. Updates are throttled to one per animation frame on
  scroll (capture phase, so ancestor scroll containers are covered), window
  resize, and element resize.

  **One behavioural difference worth knowing:** the menu is positioned with
  `position: fixed` in viewport coordinates rather than `absolute`. This avoids
  resolving the offset parent's containing block, which is where hand-rolled
  positioning usually goes wrong. The trade-off: if you teleport into a container
  that has a `transform`, `filter`, `perspective`, `backdrop-filter` or
  `will-change`, that ancestor becomes the containing block for fixed elements and
  the menu will be offset. Teleporting to `body` — the normal case, and the
  default target — is unaffected. If you need a transformed container, give it
  `position: relative` and teleport there instead.

  Positioning is now covered by tests (placement, flip, viewport clamping,
  width-matching, listener cleanup, and the no-work-when-not-teleporting case),
  where previously it had none.

- 37025db: Split the single `@anilkumarthakur/select` package into six independently versioned packages under the `@anil-labs` scope.

  Each framework is now its own package rather than a subpath of one, so installing the React adapter no longer pulls Vue-only dependencies into your lockfile, and each adapter declares only the peer dependency it actually needs.

  | Before                                  | After                               |
  | --------------------------------------- | ----------------------------------- |
  | `@anilkumarthakur/select`               | `@anil-labs/select-core`            |
  | `@anilkumarthakur/select/vue`           | `@anil-labs/select-vue`             |
  | `@anilkumarthakur/select/vue/nuxt`      | `@anil-labs/select-vue/nuxt`        |
  | `@anilkumarthakur/select/react`         | `@anil-labs/select-react`           |
  | `@anilkumarthakur/select/svelte`        | `@anil-labs/select-svelte`          |
  | `@anilkumarthakur/select/solid`         | `@anil-labs/select-solid`           |
  | `@anilkumarthakur/select/web-component` | `@anil-labs/select-element`         |
  | `@anilkumarthakur/select/style.css`     | `@anil-labs/select-core/styles.css` |
  | `@anilkumarthakur/select/scss`          | `@anil-labs/select-core/scss`       |

  **Also in this release**
  - `ClearButtonProps` is now exported from the core package. Adapters could previously only reach it through a deep `core/machine` import, which the package split makes impossible.
  - `toSolidProps` and `toSvelteProps` are generic over `object` instead of taking `Record<string, unknown>`. The machine's prop bags are interfaces, and interfaces have no implicit index signature — so the usage shown in each adapter's own documentation did not typecheck.
  - The Vue adapter no longer imports the stylesheet as a side effect. Styles live in the core package and every adapter shares them, so Vue consumers were getting CSS automatically while React/Svelte/Solid consumers had to opt in. Import `@anil-labs/select-core/styles.css` explicitly.

- eed4401: Fix fourteen Vue-adapter defects across accessibility, forms, Nuxt and focus.

  **The single-select menu never closed.** `closeOnSelect` was declared as
  `{ type: Boolean }` with no default, and Vue coerces an absent Boolean prop to
  `false` rather than `undefined` — so the resolver `props.closeOnSelect ??
props.mode === 'single'` could never reach its documented fallback. After a pick
  the listbox stayed mounted over the page and `aria-expanded` stayed `"true"`
  forever. Every other adapter closed correctly, because the core machine sees a
  real `undefined`.

  **`role="combobox"` sat on an element that can never be focused.** Under the
  WAI-ARIA 1.2 combobox pattern the focused element _is_ the combobox. When
  `searchable` (the default) that is the search input, but the role,
  `aria-expanded` and `aria-label` were all on a `tabindex="-1"` wrapper div — so
  a screen reader announced the focused element as a plain edit field and was
  never told the popup opened or closed. The semantics now live on whichever
  element is actually focusable. The input also keeps its `aria-label` after a
  value is picked; previously the placeholder was stripped and the focused input
  was left with no accessible name at all.

  **The clear and tag-remove buttons were keyboard-inoperable.** Both were
  `tabindex="-1"` with `mousedown`-only handlers, and keyboard activation of a
  `<button>` arrives as a `click`. They are now in the tab order and handle both,
  so a mouse press does not double-fire. Single-select previously had no keyboard
  path to clear a value at all.

  **`focus()` and `autofocus` focused the wrong element.** `a?.focus() ??
b?.focus()` — `HTMLElement.focus()` returns `undefined`, so the `??` always
  evaluated its right-hand side and the control div won. That div ignores keydown
  when searchable, so the user was left somewhere that accepted neither text nor
  arrow keys.

  **The Nuxt module registered everything against the wrong package.** Components,
  composables and the stylesheet were all pointed at `@anil-labs/select-core`,
  which exports none of them, and the stylesheet path was `style.css` where core
  exports `styles.css`. The documented one-liner setup failed three independent
  ways. Now covered by tests, including one that resolves the stylesheet path.

  **`required` never triggered native validation.** It was rendered on
  `type="hidden"` inputs, which the HTML standard bars from constraint validation,
  so a `<VSelect name required>` with no selection submitted cleanly while
  `aria-required` told screen-reader users otherwise. It now renders a
  visually-hidden but validatable control.

  **An empty multi-select submitted under the wrong key.** The empty branch used
  `name` while the populated branch used `name[]`, so `data.getAll('skills[]')`
  returned nothing precisely when the user had deselected everything.

  **A non-serialisable value crashed the render.** `JSON.stringify` was unguarded
  inside a computed read during render, so a circular object value — ordinary in
  ORM-shaped data — took the whole component down, but only when `name` was set.

  **SSR ids desynced from client ids.** `useStableId` used Vue's global instance
  counter, which keeps climbing across requests on a long-lived server while the
  client restarts at zero. Vue does not repair mismatched attributes, so
  `aria-controls` silently pointed at a non-existent element after hydration. Vue
  3.5's `useId()` is now preferred, with the counter kept as a fallback for the
  3.3/3.4 peer range.

  **`nextTick` rejections bypassed Vue's error handling.** A throw inside those
  callbacks became an unhandled rejection that `app.config.errorHandler` never
  saw. Reachable through ordinary data: option ids embed the option value, so a
  value containing a double quote produced an invalid selector on every open and
  arrow keypress. Ids are now looked up directly instead of through a selector.

  **The `filter` prop is reactive.** It was read once during setup, so swapping
  matching strategy at runtime had no effect — while `caseSensitive` beside it was
  already reactive.

  **Backspace parity.** On a non-searchable control Vue deselected the last tag
  while every other adapter did nothing. Vue now threads the same `fromSearch`
  flag the core machine uses.

  **Docs:** `VSelectProps<T>` was documented as a narrowing escape hatch it cannot
  deliver — the snippet did not compile (missing `extends OptionLike`) and the
  resulting type is not assignable to the shipped component, whose generic is
  erased. The docs now say so and show the required cast.

- 2b4767a: Fix ten defects in `<VTreeSelect>` and `<a-select>`, including an XSS sink and a
  component that could not be used without a mouse.

  **`<VTreeSelect>` had no keyboard support at all.** No keydown handler was bound
  anywhere: the popup could not be opened, navigated, selected or dismissed from
  the keyboard, no element ever carried `aria-activedescendant`, and the
  `role="treeitem"` rows had no active state — so nothing identified a current
  node to assistive technology. It now implements the tree pattern:
  ArrowDown/ArrowUp to move, ArrowRight/ArrowLeft to expand/collapse (and step
  into/out of a branch), Home/End, Enter/Space to toggle, Escape to close, and
  ArrowDown/Enter to open a closed control. The active row is exposed through
  `aria-activedescendant` and marked `is-active`. Combobox semantics also moved
  onto whichever element actually takes focus, matching `<VSelect>`.

  **`<a-select>` had an HTML injection sink.** Option labels were escaped but the
  option `id` was interpolated raw into an attribute — and ids embed the option
  value, so a value containing a quote broke out and injected markup. An
  `<img src=x onerror=…>` was genuinely constructed in the DOM. Option lists
  routinely come from an API or CMS. Every interpolated attribute is now escaped.
  Vue and React build DOM through their renderers, so only this adapter was
  affected.

  **`<a-select>` could not hold focus.** `render()` replaces the whole subtree on
  every state change, including the focused input — so focus fell to
  `document.body` on first focus, on every keystroke (the second character went to
  `<body>` and the query stuck at one) and on every arrow key. Focus and caret are
  now preserved across re-render.

  **`<a-select>` was permanently dead after unmount + re-append.**
  `disconnectedCallback` tore down the subscription unconditionally, but
  `connectedCallback` re-established it only behind `if (!this.machine)` — still
  truthy on reconnect. The machine kept working while the DOM stopped updating, so
  state and UI silently desynced. Triggered by `v-if`, list reordering, or moving
  a node into a portal.

  **`<a-select>` removed the wrong tag.** Tags carried a stringified value, so
  every object-valued tag was `"[object Object]"` and removal always matched the
  first selected option: clicking × on "Gamma" deleted "Alpha", and the `deselect`
  event reported the wrong one. Tags now resolve by index.

  **A partially-selected parent claimed to be fully checked while searching.**
  Check state was derived from the _filtered_ tree, so it counted only the leaves
  that survived the query: the row rendered and announced `aria-checked="true"`,
  and clicking it to clear the branch removed only the visible leaves while
  silently leaving the filtered-out ones selected. Nodes now resolve back to the
  full tree before their state is computed or toggled.

  **Search expansion was never reverted.** The auto-expand watcher claimed
  clearing the query restored the baseline, but the only re-seed keyed on tree
  identity, which a query never changes. Every search permanently opened more of
  the tree until it was effectively fully expanded — contradicting
  `default-expand-all="false"`.

  **A parent id could get stuck in `v-model`.** With lazily-loaded children a node
  ships with `children: []`, so it is a legitimate leaf and selectable; once its
  children arrive the stored value is a parent id. No tag rendered, so the user
  could not remove it, its own row showed unchecked so clicking added children
  instead — yet the toolbar counted it and the hidden input still submitted it.
  Stale values are now dropped when the tree rebuilds, guarded so an async load
  that briefly passes `[]` cannot wipe the selection.

  **`maxSelections` emitted `@select` for leaves it discarded.** Toggling a parent
  emitted the capped array but then fired `@select` for every leaf in the branch,
  describing selections that never happened. The leaf path already checked the cap
  before emitting, so the two paths in the same composable disagreed.

  **`autofocus` focused the wrong element**, the same `a?.focus() ?? b?.focus()`
  misuse fixed in `<VSelect>` — `focus()` returns `undefined`, so both ran and the
  control wrapper won.

  Lint is now clean at `error` level: all 11 type-aware findings from the split are
  fixed or explicitly refuted, so the temporary `warn` tier is gone.

### Patch Changes

- 6bdef2d: **`<VSelect>` / `<VTreeSelect>`: Enter now commits against the query you typed.**

  With `debounce` set, the rendered list lags the query — so pressing Enter before
  the trailing edge acted on the _stale_ list. Typing `"Gam"` into a
  `['Alpha', 'Beta', 'Gamma']` select and hitting Enter committed **`"Alpha"`**,
  the first row of the not-yet-filtered list. Type-then-Enter is the ordinary
  type-ahead flow, so this fired constantly rather than in some edge case.

  Enter now flushes any pending debounce first, then re-resolves the target: a
  deliberate highlight is kept when it still matches the new query, otherwise it
  falls back to the selected option, else the first enabled one. The same fix
  applies to `<VTreeSelect>`'s Enter and Space.

  **`@anil-labs/select-react` no longer declares a `react-dom` peer.** The
  components render host elements and never import it, so the declaration forced
  an install the package doesn't need. `react` remains the only peer; `react-dom`
  is whatever your app already renders with.

- 19be8cd: Fix the published Vue bundle, and make every package installable and documented.

  **`@anil-labs/select-vue` was unusable when built.** The bundle was compiled with
  the classic React JSX factory, so every component — `VSelect`, `VSelectTag`,
  `VTreeSelect`, `VSelectOption` — threw `ReferenceError: React is not defined` on
  first render, in both the ESM and the CJS (Nuxt/SSR) entry.

  The cause was a split between test and build config: vitest compiles the `.tsx`
  sources through `@vitejs/plugin-vue-jsx`, but tsup registered no JSX plugin, and
  esbuild only honours `jsxImportSource` under the _automatic_ runtime — with
  `jsx: "preserve"` it silently fell back to `React.createElement`. No test
  imported `dist`, so the whole suite stayed green.

  The transform is now overridden in `tsup.config.ts` via `esbuildOptions` rather
  than in `tsconfig.json`, because Vue's `jsx-runtime` declares no
  `ElementChildrenAttribute` and cannot be type-checked under the automatic
  runtime. A new post-build `scripts/check-dist.mjs` mounts the real artifact
  (ESM and CJS) in jsdom and fails the build if it cannot render, so this class of
  defect can no longer reach npm.

  **`@anil-labs/select-core/styles.css` now type-checks.** The stylesheet import
  shown in every framework guide failed on a stock tsconfig with `TS2882`. The
  subpath export gained a `types` condition pointing at a stub, so consumers no
  longer need their own `*.css` shim. Verified under both `bundler` and `node16`
  resolution.

  **Every package now ships a README.** All six npm pages would previously have
  rendered blank.

  CI, release and Pages workflows were still written for the pre-monorepo,
  npm-with-a-lockfile layout and could not build, test or publish anything. They
  now use pnpm workspaces and the Changesets release flow, and CI builds before it
  tests so the new bundle guard gates every PR.

- b586bd9: Fix twelve state-machine, normalisation and tree defects in the core. Every
  adapter inherits these, since they all run on the same machine.

  **Controlled `modelValue` could never be re-asserted.** `emitChange()` updated
  the internal selection but left `config.modelValue` stale, and `update()` diffed
  incoming values against that stale copy. A parent that rejected a change,
  reverted after a failed save, or reset a form pushed back the value it last
  passed, the diff saw "no change", and the machine kept its own selection
  indefinitely. Only passing a _different_ value recovered.

  **The highlight was never reconciled when the option list changed.** After an
  async response replaced a longer list — the documented pattern — `activeIndex`
  pointed past the end: no row rendered active, `aria-activedescendant` was
  `undefined` so screen readers announced nothing, and Enter still called
  `preventDefault()` (swallowing form submission) before selecting nothing. Enter
  now resolves its target before consuming the key, and leaves the event alone
  when there is nothing to act on. `moveActive`/`moveActiveLast` also clear the
  index and notify when every option is disabled, instead of leaving a stale one.

  **Tags mode fired `onCreate` for queries it had already rejected.** Typing an
  exact match showed the real option and no create row, but Enter created a
  duplicate tag anyway and never emitted `onChange`. Enter now selects the exact
  match. Queries are trimmed consistently, so a whitespace-only query is no longer
  creatable and `"Vue "` no longer offers to create a second `"Vue"`.

  **An option valued `''` could be selected but never appeared selected.** The
  empty-string carve-out that normalises an _incoming_ `modelValue` was also
  applied to emitted values, so `onChange('')` fired while the machine recorded
  nothing. `''` is the native-`<select>` "no preference" sentinel, so this is
  ordinary data. Incoming `''` still means "nothing selected".

  **`NaN` could never be deselected.** Three different equality strategies were in
  use; `isSelected` (SameValueZero, via `Set`) disagreed with the removal path
  (strict `!==`), so clicking a `NaN`-valued option fired `onDeselect` on every
  click while it stayed selected forever. Everything now routes through
  `valuesEqual`, which is SameValueZero — matching the `Set`/`Map` lookups the
  machine already used. `toggleValue([NaN], NaN)` returns `[]` instead of
  `[NaN, NaN]`.

  **Non-primitive labels no longer render as `"[object Object]"`.** An
  i18n-shaped label reached the row text, the collapsed control's accessible name,
  and the tag remove button's `aria-label` — and, because `label` is the only
  field search matches against, made the option unreachable by typing. Labels now
  go through `safeLabel()`, which falls back to the option value and warns once in
  dev telling you to supply an `optionLabel` accessor.

  **Selected values missing from `options` keep their label.** The synthetic
  placeholder ignored the configured accessors, so clearing the option list turned
  a chosen "Ada Lovelace" back into the raw id `u_8f21c`. The machine now
  remembers the last resolved option per selected value. Synthetic ids are
  index-qualified, so values with empty labels no longer collide on `synthetic-`
  and React no longer warns about duplicate keys.

  **`filterTree` pruned a matched parent's entire subtree.** Searching a branch
  label produced a node with `isLeaf: false` and zero children — a row that
  rendered a checkbox and an expand chevron but had nothing to select or expand.
  Clicking it emitted no model update while the checkbox stayed visually ticked. A
  node that matches on its own label now keeps its whole subtree.

  **A cyclic tree crashed the render.** `normalizeTree` recursed unbounded and
  threw `RangeError` out of the Vue `computed` that calls it during render, taking
  the component tree down. Cycles arrive easily from graph-shaped server data; the
  repeated node is now dropped with a dev warning.

  Every fix ships with a regression test that fails against the previous release —
  23 of them.

- Updated dependencies [37025db]
- Updated dependencies [19be8cd]
- Updated dependencies [b586bd9]
- Updated dependencies [eed4401]
  - @anil-labs/select-core@0.1.0
