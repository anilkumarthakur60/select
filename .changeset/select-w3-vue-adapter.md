---
'@anil-labs/select-vue': minor
'@anil-labs/select-core': patch
---

Fix fourteen Vue-adapter defects across accessibility, forms, Nuxt and focus.

**The single-select menu never closed.** `closeOnSelect` was declared as
`{ type: Boolean }` with no default, and Vue coerces an absent Boolean prop to
`false` rather than `undefined` — so the resolver `props.closeOnSelect ??
props.mode === 'single'` could never reach its documented fallback. After a pick
the listbox stayed mounted over the page and `aria-expanded` stayed `"true"`
forever. Every other adapter closed correctly, because the core machine sees a
real `undefined`.

**`role="combobox"` sat on an element that can never be focused.** Under the
WAI-ARIA 1.2 combobox pattern the focused element *is* the combobox. When
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
