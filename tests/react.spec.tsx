/** @jsxImportSource react */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Select } from '@/react'

// React 19 will silently swallow act() flushing without this flag,
// leaving rendered output stale after state updates fire from event
// dispatches in tests.
beforeAll(() => {
  ;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

// React 19's createRoot + act() lets us test the React adapter without
// pulling in @testing-library/react. JSDOM is enough for the markup
// assertions; pointer events are dispatched manually.
describe('react <Select>', () => {
  let container: HTMLDivElement
  let root: Root

  function mount(node: React.ReactNode) {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => {
      root.render(node)
    })
  }

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('renders a control + listbox + the option list', () => {
    mount(<Select options={['a', 'b', 'c']} />)
    expect(container.querySelector('[role="combobox"]')).not.toBeNull()
    expect(container.querySelector('[role="listbox"]')).not.toBeNull()
    expect(container.querySelectorAll('[role="option"]').length).toBe(3)
  })

  it('selects an option on mousedown and fires onChange', () => {
    const onChange = vi.fn()
    mount(<Select options={['a', 'b']} mode="single" onChange={onChange} />)

    const second = container.querySelectorAll<HTMLElement>('[role="option"]')[1]!
    act(() => {
      second.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
    })
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('toggles values in multi mode without closing', () => {
    const onChange = vi.fn()
    mount(<Select options={['a', 'b']} mode="multiple" onChange={onChange} />)

    const opts = container.querySelectorAll<HTMLElement>('[role="option"]')
    act(() => {
      opts[0]!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
    })
    act(() => {
      opts[1]!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
    })
    expect(onChange).toHaveBeenLastCalledWith(['a', 'b'])
  })

  it('filters the list as the user types', () => {
    mount(<Select options={['apple', 'banana', 'apricot']} />)
    const input = container.querySelector<HTMLInputElement>('input.vselect-search')!
    // React's value-tracker pins the controlled `value` and skips the
    // synthetic onChange unless the prototype setter is used. Dispatching
    // a native InputEvent (rather than a generic Event) is what React's
    // event system listens for on inputs.
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    act(() => {
      setter.call(input, 'ap')
      input.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'ap' }))
    })
    const labels = Array.from(
      container.querySelectorAll<HTMLElement>('[role="option"]'),
    ).map((el) => el.textContent?.trim())
    expect(labels).toEqual(['apple', 'apricot'])
  })
})
