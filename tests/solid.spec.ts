import { describe, expect, it, vi } from 'vitest'
import { createRoot } from 'solid-js'
import { createSelect, toSolidProps } from '@/solid'

// The Solid primitive uses `onCleanup`, which is only valid inside a
// reactive root. Wrap each test in `createRoot(dispose => ...)` so the
// subscription registers correctly and is torn down at the end.
describe('solid adapter', () => {
  it('createSelect returns a machine and a tick signal', () => {
    createRoot((dispose) => {
      const select = createSelect({ options: ['a', 'b'], mode: 'single' })
      expect(select.tick()).toBe(0)
      select.machine.open()
      // The machine's open() notifies subscribers, which bumps the signal.
      expect(select.tick()).toBe(1)
      dispose()
    })
  })

  it('selecting an option flips selectedValues + ticks', () => {
    createRoot((dispose) => {
      const onChange = vi.fn()
      const select = createSelect({
        options: ['a', 'b'],
        mode: 'single',
        onChange,
      })
      const opt = select.machine.getNormalizedOptions()[1]!
      select.machine.selectOption(opt)
      expect(onChange).toHaveBeenCalledWith('b')
      expect(select.tick()).toBeGreaterThan(0)
      dispose()
    })
  })

  it('toSolidProps lowercases on* event keys', () => {
    const handler = () => {}
    const out = toSolidProps({
      class: 'x',
      onMousedown: handler,
      'aria-label': 'pick one',
    })
    expect(out.class).toBe('x')
    expect(out['aria-label']).toBe('pick one')
    expect(out.onmousedown).toBe(handler)
    expect(out.onMousedown).toBeUndefined()
  })
})
