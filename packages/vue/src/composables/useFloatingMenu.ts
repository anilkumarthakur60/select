import {
  computed,
  onScopeDispose,
  ref,
  watch,
  type ComputedRef,
  type CSSProperties,
  type Ref,
} from 'vue'

export interface UseFloatingMenuOptions {
  /**
   * Mirror of `props.teleportTo`. When `false` / `undefined` the menu sits
   * next to the control in the document flow and we skip positioning
   * entirely; otherwise the menu is mounted via `<Teleport>` and pinned to
   * the control.
   */
  teleportTo: Ref<string | HTMLElement | false | undefined>
  /** Gap between the control and the menu, in px. */
  offset?: number
  /** Minimum gap to keep between the menu and the viewport edge, in px. */
  padding?: number
}

export interface UseFloatingMenuReturn {
  /** CSS to apply to the menu element. `undefined` when not floating. */
  styles: ComputedRef<CSSProperties | undefined>
  /** Resolved teleport target: `null` when the menu is in flow. */
  target: ComputedRef<string | HTMLElement | null>
  /** Whether floating mode is active (i.e. teleporting). */
  floating: ComputedRef<boolean>
  /** Imperative reposition trigger — fire after layout-affecting changes. */
  update: () => void
}

/**
 * Positions the teleported menu against its control.
 *
 * This replaces `@floating-ui/vue`. That library is excellent, but it was a
 * hard dependency (~7.6 KB gzipped after tree-shaking, plus three transitive
 * packages) used by exactly one file, for a feature that is **opt-in and off by
 * default** — `teleportTo` defaults to `false`. Worse, `useFloating()` was
 * called unconditionally, so a default-configured select constructed a
 * ResizeObserver and attached four window scroll/resize listeners on every
 * mount, computed a position, and then discarded it because `floating` was
 * false. Nothing is attached now unless the menu is actually teleported.
 *
 * What this implements, matching the previous middleware chain:
 *   - `offset(6)`      — gap between control and menu
 *   - `flip`           — place above when there isn't room below
 *   - `shift(8)`       — clamp horizontally inside the viewport
 *   - `size`           — menu is at least as wide as the control
 *   - `autoUpdate`     — reposition on scroll, resize, and element resize
 *
 * **Strategy: `position: fixed`, in viewport coordinates.** This is the one
 * decision worth understanding. `absolute` would need the offset-parent's
 * containing block resolved — body margins, positioned ancestors, and
 * transformed ancestors all change the origin, and getting that wrong is the
 * classic hand-rolled-positioning bug. Fixed coordinates come straight from
 * `getBoundingClientRect()` with no arithmetic, at the cost of having to
 * reposition on scroll (which is rAF-throttled below).
 *
 * **Known limitation:** a `transform`, `filter`, `perspective`, `backdrop-filter`
 * or `will-change` on an ancestor of the *teleport target* makes that ancestor
 * the containing block for `position: fixed`, so the menu would be offset.
 * Teleporting to `body` (the normal case) is unaffected. If you teleport into a
 * transformed container, position that container and teleport there instead.
 */
export function useFloatingMenu(
  reference: Ref<HTMLElement | null>,
  floatingEl: Ref<HTMLElement | null>,
  opts: UseFloatingMenuOptions,
): UseFloatingMenuReturn {
  const gap = opts.offset ?? 6
  const edge = opts.padding ?? 8

  const floating = computed(() => opts.teleportTo.value !== false)
  const computedStyles = ref<CSSProperties | undefined>(undefined)

  let frame: number | null = null
  let observer: ResizeObserver | null = null
  let attachedTo: { reference: HTMLElement; floating: HTMLElement } | null = null

  function position() {
    frame = null
    const anchor = reference.value
    const menu = floatingEl.value
    if (!floating.value || !anchor || !menu) return

    const anchorRect = anchor.getBoundingClientRect()
    const menuRect = menu.getBoundingClientRect()

    // The menu is at least as wide as the control (the old `size` middleware),
    // so clamp against whichever is wider — the rect may still report the
    // pre-minWidth width on the very first pass.
    const width = Math.max(menuRect.width, anchorRect.width)
    const height = menuRect.height

    const viewportWidth = document.documentElement.clientWidth
    const viewportHeight = document.documentElement.clientHeight

    // flip: prefer below, go above only when below genuinely doesn't fit AND
    // above has more room. Without the second test a menu taller than both
    // gaps would flip to the *worse* side.
    const roomBelow = viewportHeight - anchorRect.bottom - gap - edge
    const roomAbove = anchorRect.top - gap - edge
    const placeAbove = height > roomBelow && roomAbove > roomBelow

    const top = placeAbove ? anchorRect.top - gap - height : anchorRect.bottom + gap

    // shift: keep the menu inside the viewport horizontally. Clamping the max
    // first and the min second means a menu wider than the viewport pins to the
    // left edge rather than the right.
    let left = anchorRect.left
    left = Math.min(left, viewportWidth - width - edge)
    left = Math.max(edge, left)

    computedStyles.value = {
      position: 'fixed',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      minWidth: `${Math.round(anchorRect.width)}px`,
    }
  }

  /** Coalesce bursts of scroll/resize events into one reposition per frame. */
  function schedule() {
    if (frame !== null) return
    frame = requestAnimationFrame(position)
  }

  function detach() {
    if (frame !== null) {
      cancelAnimationFrame(frame)
      frame = null
    }
    observer?.disconnect()
    observer = null
    if (attachedTo) {
      // `capture: true` on scroll so we also hear scrolls in ancestor
      // containers, which don't bubble.
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      attachedTo = null
    }
    computedStyles.value = undefined
  }

  function attach(anchor: HTMLElement, menu: HTMLElement) {
    attachedTo = { reference: anchor, floating: menu }
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(schedule)
      observer.observe(anchor)
      observer.observe(menu)
    }
    position()
  }

  // Attach only while genuinely floating and both elements exist. The menu is
  // mounted/unmounted as it opens and closes, so this runs on every open.
  watch(
    [floating, reference, floatingEl],
    ([isFloating, anchor, menu]) => {
      detach()
      if (!isFloating || !anchor || !menu) return
      if (typeof window === 'undefined') return
      attach(anchor, menu)
    },
    { flush: 'post' },
  )

  onScopeDispose(detach)

  const styles = computed<CSSProperties | undefined>(() =>
    floating.value ? computedStyles.value : undefined,
  )

  const target = computed<string | HTMLElement | null>(() => {
    const v = opts.teleportTo.value
    return v === false || v === undefined ? null : v
  })

  return { styles, target, floating, update: schedule }
}
