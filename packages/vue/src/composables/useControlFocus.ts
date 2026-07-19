import { onScopeDispose, ref, type Ref } from 'vue'

export interface UseControlFocusOptions {
  /** Root element — focus is treated as "still inside" while it contains the active element. */
  root: Ref<HTMLElement | null>
  /** Fired when the control gains focus from outside. */
  onFocus?: (event: FocusEvent) => void
  /** Fired after focus leaves the control entirely (children → outside). */
  onBlur?: (event: FocusEvent) => void
}

export interface UseControlFocusReturn {
  /** Mirror of "focus is somewhere inside the root". */
  focused: Ref<boolean>
  /** Bind to `@focusin` on the root element. */
  onFocusIn: (event: FocusEvent) => void
  /** Bind to `@focusout` on the root element. */
  onFocusOut: (event: FocusEvent) => void
}

/**
 * Tracks whether focus is anywhere inside the control. The trick is that
 * tabbing between the input, indicators, and tag-remove buttons all fire
 * `focusout` immediately followed by a `focusin` — so we defer the blur
 * decision to the next animation frame and only fire `onBlur` if focus
 * really left the root subtree.
 *
 * The pending rAF is cancelled on unmount so we don't fire after the
 * component is gone.
 */
export function useControlFocus(opts: UseControlFocusOptions): UseControlFocusReturn {
  const focused = ref(false)
  let pending: number | undefined

  function cancelPending() {
    if (pending !== undefined) {
      cancelAnimationFrame(pending)
      pending = undefined
    }
  }

  function onFocusIn(event: FocusEvent) {
    cancelPending()
    if (focused.value) return
    focused.value = true
    opts.onFocus?.(event)
  }

  function onFocusOut(event: FocusEvent) {
    cancelPending()
    pending = requestAnimationFrame(() => {
      pending = undefined
      if (!opts.root.value?.contains(document.activeElement)) {
        focused.value = false
        opts.onBlur?.(event)
      }
    })
  }

  onScopeDispose(cancelPending)

  return { focused, onFocusIn, onFocusOut }
}
