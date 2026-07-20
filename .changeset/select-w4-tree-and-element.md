---
'@anil-labs/select-element': minor
'@anil-labs/select-vue': minor
'@anil-labs/select-svelte': patch
---

Fix ten defects in `<VTreeSelect>` and `<a-select>`, including an XSS sink and a
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
Check state was derived from the *filtered* tree, so it counted only the leaves
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
