import { computed, type ComputedRef, type CSSProperties, type Ref } from 'vue'
import {
  autoUpdate,
  flip,
  offset,
  shift,
  size as floatingSize,
  useFloating,
} from '@floating-ui/vue'

export interface UseFloatingMenuOptions {
  /**
   * Mirror of `props.teleportTo`. When `false` / `undefined` the menu sits
   * next to the control in the document flow and we skip the floating
   * positioning entirely; otherwise the menu is mounted via `<Teleport>`
   * and floating UI keeps it pinned to the control.
   */
  teleportTo: Ref<string | HTMLElement | false | undefined>
  /** Gap between the control and the menu, in px. */
  offset?: number
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
 * Centralises the @floating-ui/vue setup our selects share. Both `<VSelect>`
 * and `<VTreeSelect>` need the same middleware (offset / flip / shift /
 * width-match) and the same gating on `teleportTo` — keeping it here means
 * consumers building custom variants get the same well-tuned behaviour for
 * free, and we only have one place to tune positioning.
 */
export function useFloatingMenu(
  reference: Ref<HTMLElement | null>,
  floatingEl: Ref<HTMLElement | null>,
  opts: UseFloatingMenuOptions,
): UseFloatingMenuReturn {
  const floating = computed(() => opts.teleportTo.value !== false)

  const { floatingStyles, update } = useFloating(reference, floatingEl, {
    placement: 'bottom-start',
    middleware: [
      offset(opts.offset ?? 6),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      floatingSize({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
          })
        },
      }),
    ],
    whileElementsMounted: (...args) => autoUpdate(...args, { animationFrame: false }),
  })

  const styles = computed<CSSProperties | undefined>(() =>
    floating.value ? floatingStyles.value : undefined,
  )

  const target = computed<string | HTMLElement | null>(() => {
    const v = opts.teleportTo.value
    return v === false || v === undefined ? null : v
  })

  return { styles, target, floating, update }
}
