import type { Ref } from 'vue'

export interface UseTriggerInteractionsOptions {
  disabled: Ref<boolean>
  searchable: Ref<boolean>
  isOpen: Ref<boolean>
  /** Search input element — focused on toggle so typing keeps working. */
  searchEl: Ref<HTMLInputElement | null>
  /** Live query ref — written to on every keystroke. */
  query: Ref<string>
  open: () => void
  toggle: () => void
  /**
   * CSS selectors that, when matched on (or above) the click target, should
   * skip the menu toggle. Defaults to the tag-remove button so clicking the
   * "x" on a tag doesn't also toggle the menu.
   */
  ignoreSelectors?: readonly string[]
}

export interface UseTriggerInteractionsReturn {
  /** Bind to `@mousedown` on the trigger element. */
  onControlMousedown: (event: MouseEvent) => void
  /** Bind to `@input` on the search input. */
  onSearchInput: (event: Event) => void
}

/**
 * Mouse + input handlers shared by `<VSelect>` and `<VTreeSelect>` triggers.
 * Both components had near-identical handlers inline; centralising them here
 * keeps the toggle / focus / open semantics in lockstep across components and
 * gives headless consumers a drop-in handler pair.
 */
export function useTriggerInteractions(
  opts: UseTriggerInteractionsOptions,
): UseTriggerInteractionsReturn {
  const ignore = opts.ignoreSelectors ?? ['.vselect-tag-remove']

  function onControlMousedown(event: MouseEvent) {
    if (opts.disabled.value) return
    const target = event.target as HTMLElement | null
    if (!target) return

    for (const selector of ignore) {
      if (target.closest(selector)) return
    }

    // Clicking the search input *should* open the menu (otherwise the trigger
    // feels half-broken in single mode where the input covers most of the
    // control). We don't preventDefault — let the browser place the caret —
    // and use `open()` rather than `toggle()` so clicking inside an
    // already-open input doesn't snap the menu shut.
    if (target.tagName === 'INPUT') {
      if (!opts.isOpen.value) opts.open()
      return
    }

    event.preventDefault()
    if (opts.searchable.value && opts.searchEl.value) opts.searchEl.value.focus()
    opts.toggle()
  }

  function onSearchInput(event: Event) {
    opts.query.value = (event.target as HTMLInputElement).value
    if (!opts.isOpen.value) opts.open()
  }

  return { onControlMousedown, onSearchInput }
}
