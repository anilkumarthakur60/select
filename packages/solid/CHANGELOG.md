# @anil-labs/select-solid

## 0.1.0

### Minor Changes

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

### Patch Changes

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
