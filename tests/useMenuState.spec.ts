import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useMenuState } from '@/composables/useMenuState'

describe('useMenuState', () => {
  it('toggles open/close', () => {
    const { isOpen, open, close, toggle } = useMenuState({ itemsCount: ref(0) })
    expect(isOpen.value).toBe(false)
    open()
    expect(isOpen.value).toBe(true)
    close()
    expect(isOpen.value).toBe(false)
    toggle()
    expect(isOpen.value).toBe(true)
  })

  it('resets activeIndex when items count changes', async () => {
    const itemsCount = ref(5)
    const { activeIndex } = useMenuState({ itemsCount })
    activeIndex.value = 3
    itemsCount.value = 2
    await new Promise((r) => setTimeout(r, 0))
    expect(activeIndex.value).toBe(-1)
  })

  it('resets activeIndex on close', () => {
    const { activeIndex, open, close } = useMenuState({ itemsCount: ref(5) })
    open()
    activeIndex.value = 2
    close()
    expect(activeIndex.value).toBe(-1)
  })
})
