import { describe, expect, it, vi } from 'vitest'
import { createSelectAdapter, toSvelteProps } from '@/index'

// The Svelte adapter is headless  no .svelte component ships from this
// package, so the smoke test asserts only that:
//   1. the wrapper returns a working machine + subscribe pair
//   2. the prop translator lowercases event keys for Svelte 5's `onevent`
//      attribute style and leaves everything else alone
describe('svelte adapter', () => {
  it('createSelectAdapter exposes the machine and subscribe', () => {
    const adapter = createSelectAdapter({ options: ['a', 'b'], mode: 'single' })
    const cb = vi.fn()
    const unsub = adapter.subscribe(cb)
    adapter.machine.open()
    expect(cb).toHaveBeenCalled()
    expect(adapter.machine.getState().isOpen).toBe(true)
    unsub()
    cb.mockClear()
    adapter.machine.close()
    expect(cb).not.toHaveBeenCalled()
  })

  it('reflects external modelValue updates', () => {
    const adapter = createSelectAdapter({ options: ['a', 'b'], mode: 'single' })
    adapter.machine.update({ modelValue: 'b' })
    expect(adapter.machine.getState().selectedValues).toEqual(['b'])
  })

  it('toSvelteProps lowercases on* event keys', () => {
    const handler = () => {}
    const out = toSvelteProps({
      class: 'x',
      tabindex: 0,
      role: 'combobox',
      onMousedown: handler,
      onKeydown: handler,
    })
    expect(out.class).toBe('x')
    expect(out.tabindex).toBe(0)
    expect(out.role).toBe('combobox')
    expect(out.onmousedown).toBe(handler)
    expect(out.onkeydown).toBe(handler)
    expect(out.onMousedown).toBeUndefined()
  })
})
