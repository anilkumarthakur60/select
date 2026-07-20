---
'@anil-labs/select-vue': minor
---

Drop the `@floating-ui/vue` dependency — menu positioning is now implemented
in-house. `@anil-labs/select-vue` has no runtime dependency other than
`@anil-labs/select-core`.

The library was only used to position the menu when `teleport-to` is set, which
is **opt-in and off by default**. It cost consumers ~7.6 KB gzipped after
tree-shaking, plus three transitive packages in the lockfile.

More importantly, `useFloating()` was called *unconditionally* — the teleport
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
