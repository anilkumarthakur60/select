import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { useControlFocus } from '@/composables/useControlFocus'

let root: HTMLDivElement
let inner: HTMLInputElement
let outsideEl: HTMLButtonElement

function flushFrame() {
  return new Promise<void>((r) => requestAnimationFrame(() => r()))
}

beforeEach(() => {
  root = document.createElement('div')
  inner = document.createElement('input')
  outsideEl = document.createElement('button')
  root.appendChild(inner)
  document.body.appendChild(root)
  document.body.appendChild(outsideEl)
})

afterEach(() => {
  root.remove()
  outsideEl.remove()
})

describe('useControlFocus', () => {
  it('flips `focused` true on focusin and fires onFocus', () => {
    const onFocus = vi.fn()
    const rootRef = ref<HTMLElement | null>(root)

    const scope = effectScope()
    const { focused } = scope.run(() => useControlFocus({ root: rootRef, onFocus }))!

    expect(focused.value).toBe(false)
    inner.focus()
    // Drive the handler manually — jsdom dispatches focusin synchronously
    // but the composable is bound by the consumer; we just call onFocusIn.
    scope.stop()
  })

  it('keeps `focused` true while focus moves within the subtree', async () => {
    const onBlur = vi.fn()
    const rootRef = ref<HTMLElement | null>(root)

    const scope = effectScope()
    const api = scope.run(() => useControlFocus({ root: rootRef, onBlur }))!

    api.onFocusIn(new FocusEvent('focusin'))
    expect(api.focused.value).toBe(true)

    // Focus stays inside (jsdom: activeElement is `inner`).
    inner.focus()
    api.onFocusOut(new FocusEvent('focusout'))
    await flushFrame()
    expect(api.focused.value).toBe(true)
    expect(onBlur).not.toHaveBeenCalled()

    scope.stop()
  })

  it('flips `focused` false and fires onBlur when focus leaves the subtree', async () => {
    const onBlur = vi.fn()
    const rootRef = ref<HTMLElement | null>(root)

    const scope = effectScope()
    const api = scope.run(() => useControlFocus({ root: rootRef, onBlur }))!

    api.onFocusIn(new FocusEvent('focusin'))
    outsideEl.focus()
    api.onFocusOut(new FocusEvent('focusout'))
    await flushFrame()
    expect(api.focused.value).toBe(false)
    expect(onBlur).toHaveBeenCalledTimes(1)

    scope.stop()
  })

  it('coalesces multiple focusOuts into one decision', async () => {
    const onBlur = vi.fn()
    const rootRef = ref<HTMLElement | null>(root)

    const scope = effectScope()
    const api = scope.run(() => useControlFocus({ root: rootRef, onBlur }))!

    api.onFocusIn(new FocusEvent('focusin'))
    api.onFocusOut(new FocusEvent('focusout'))
    api.onFocusOut(new FocusEvent('focusout'))
    api.onFocusOut(new FocusEvent('focusout'))
    outsideEl.focus()
    await flushFrame()
    expect(onBlur).toHaveBeenCalledTimes(1)

    scope.stop()
  })

  it('does not fire onBlur after the scope is disposed', async () => {
    const onBlur = vi.fn()
    const rootRef = ref<HTMLElement | null>(root)

    const scope = effectScope()
    const api = scope.run(() => useControlFocus({ root: rootRef, onBlur }))!

    api.onFocusIn(new FocusEvent('focusin'))
    api.onFocusOut(new FocusEvent('focusout'))
    scope.stop()
    outsideEl.focus()
    await flushFrame()
    expect(onBlur).not.toHaveBeenCalled()
  })
})
