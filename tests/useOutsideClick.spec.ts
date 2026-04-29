import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useOutsideClick } from '@/composables/useOutsideClick'

function pointerDown(target: Element) {
  const event = new Event('pointerdown', { bubbles: true, cancelable: true })
  target.dispatchEvent(event)
}

let inside: HTMLDivElement
let outside: HTMLDivElement

beforeEach(() => {
  inside = document.createElement('div')
  outside = document.createElement('div')
  document.body.appendChild(inside)
  document.body.appendChild(outside)
})

afterEach(() => {
  inside.remove()
  outside.remove()
})

describe('useOutsideClick', () => {
  it('fires when pointerdown lands outside every contained ref', () => {
    const onOutside = vi.fn()
    const active = ref(true)
    const containedRef = ref<HTMLElement | null>(inside)

    const scope = effectScope()
    scope.run(() => {
      useOutsideClick({ active, contains: [containedRef], onOutside })
    })

    pointerDown(outside)
    expect(onOutside).toHaveBeenCalledTimes(1)
    scope.stop()
  })

  it('does not fire when pointerdown is inside a contained subtree', () => {
    const onOutside = vi.fn()
    const active = ref(true)
    const containedRef = ref<HTMLElement | null>(inside)

    const child = document.createElement('span')
    inside.appendChild(child)

    const scope = effectScope()
    scope.run(() => {
      useOutsideClick({ active, contains: [containedRef], onOutside })
    })

    pointerDown(child)
    expect(onOutside).not.toHaveBeenCalled()
    scope.stop()
  })

  it('attaches/removes the listener as `active` toggles', async () => {
    const onOutside = vi.fn()
    const active = ref(false)
    const containedRef = ref<HTMLElement | null>(inside)

    const scope = effectScope()
    scope.run(() => {
      useOutsideClick({ active, contains: [containedRef], onOutside })
    })

    pointerDown(outside)
    expect(onOutside).not.toHaveBeenCalled()

    active.value = true
    await nextTick()
    pointerDown(outside)
    expect(onOutside).toHaveBeenCalledTimes(1)

    active.value = false
    await nextTick()
    pointerDown(outside)
    expect(onOutside).toHaveBeenCalledTimes(1)
    scope.stop()
  })

  it('removes the listener when the surrounding scope is disposed', () => {
    const onOutside = vi.fn()
    const active = ref(true)
    const containedRef = ref<HTMLElement | null>(inside)

    const scope = effectScope()
    scope.run(() => {
      useOutsideClick({ active, contains: [containedRef], onOutside })
    })

    scope.stop()
    pointerDown(outside)
    expect(onOutside).not.toHaveBeenCalled()
  })
})
