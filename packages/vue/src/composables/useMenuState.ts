import { ref, watch, type Ref } from 'vue'

export interface UseMenuStateOptions {
  /**
   * Length of the visible item list. The composable resets `activeIndex`
   * whenever this changes so the highlight doesn't dangle past the end of a
   * shrunken list (e.g. after a search filter or an async option reload).
   */
  itemsCount: Ref<number>
}

export interface UseMenuStateReturn {
  isOpen: Ref<boolean>
  /** -1 means "no row highlighted". */
  activeIndex: Ref<number>
  open: () => void
  close: () => void
  toggle: () => void
}

/**
 * Owns the open/close + active-row state for a combobox-style menu. Pulled
 * out of `useSelection` so selection logic and menu UI state aren't entangled
 * in the same composable — callers building a headless variant can mix and
 * match.
 */
export function useMenuState(opts: UseMenuStateOptions): UseMenuStateReturn {
  const isOpen = ref(false)
  const activeIndex = ref(-1)

  function open() {
    if (isOpen.value) return
    isOpen.value = true
  }
  function close() {
    if (!isOpen.value) return
    isOpen.value = false
    activeIndex.value = -1
  }
  function toggle() {
    if (isOpen.value) close()
    else open()
  }

  watch(opts.itemsCount, () => {
    activeIndex.value = -1
  })

  return { isOpen, activeIndex, open, close, toggle }
}
