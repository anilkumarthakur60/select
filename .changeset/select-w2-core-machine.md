---
'@anil-labs/select-core': minor
'@anil-labs/select-element': patch
'@anil-labs/select-svelte': patch
'@anil-labs/select-react': patch
'@anil-labs/select-solid': patch
'@anil-labs/select-vue': patch
---

Fix twelve state-machine, normalisation and tree defects in the core. Every
adapter inherits these, since they all run on the same machine.

**Controlled `modelValue` could never be re-asserted.** `emitChange()` updated
the internal selection but left `config.modelValue` stale, and `update()` diffed
incoming values against that stale copy. A parent that rejected a change,
reverted after a failed save, or reset a form pushed back the value it last
passed, the diff saw "no change", and the machine kept its own selection
indefinitely. Only passing a *different* value recovered.

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
empty-string carve-out that normalises an *incoming* `modelValue` was also
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
