import { onScopeDispose, watch, type Ref } from 'vue'

export interface UseOutsideClickOptions {
  /** Listener is only attached while this is `true`. */
  active: Ref<boolean>
  /** Element refs whose subtree counts as "inside". */
  contains: ReadonlyArray<Ref<HTMLElement | null>>
  /** Fired when a `pointerdown` lands outside every `contains` element. */
  onOutside: (event: PointerEvent) => void
}

// SSR-safe DOM check — `document` is undefined on the server, and the
// `immediate: true` watcher below would crash if it tried to detach a
// listener it never had a chance to attach.
const hasDocument = typeof document !== 'undefined'

/**
 * Listens for `pointerdown` events outside a set of elements while `active`
 * is true. We use `pointerdown` rather than `click` so menus close before
 * focus transitions complete — clicking outside an open select feels
 * sluggish if you wait for the trailing click. The listener is attached
 * with `capture: true` so a stopPropagation inside the menu doesn't shadow
 * us (the floating menu is a sibling once teleported).
 */
export function useOutsideClick(opts: UseOutsideClickOptions): void {
  if (!hasDocument) return

  function handler(event: PointerEvent) {
    if (!opts.active.value) return
    const target = event.target as Node | null
    if (!target) return
    for (const el of opts.contains) {
      if (el.value?.contains(target)) return
    }
    opts.onOutside(event)
  }

  // `immediate` so a composable mounted with `active: true` (e.g. an
  // already-open menu on first render) attaches the listener right away
  // instead of waiting for the next toggle.
  watch(
    opts.active,
    (active) => {
      if (active) document.addEventListener('pointerdown', handler, true)
      else document.removeEventListener('pointerdown', handler, true)
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    document.removeEventListener('pointerdown', handler, true)
  })
}
