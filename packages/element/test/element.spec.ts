import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineSelectElement } from '@/index'

// Register the element once for the whole suite. customElements.define
// throws on duplicate names, so a beforeAll is the safer hook.
beforeAll(() => {
  defineSelectElement('a-select-test')
})

describe('<a-select> web component', () => {
  let el: HTMLElement

  afterEach(() => {
    el?.remove()
  })

  it('connects, renders the control + menu, and reflects options', () => {
    el = document.createElement('a-select-test')
    document.body.appendChild(el)
    ;(el as unknown as { options: unknown[] }).options = ['a', 'b']

    const control = el.querySelector('.vselect-control')
    const menu = el.querySelector('.vselect-menu')
    const options = el.querySelectorAll('.vselect-option')
    expect(control).not.toBeNull()
    expect(menu).not.toBeNull()
    expect(options.length).toBe(2)
  })

  it('dispatches `change` with the selected value when an option is clicked', () => {
    el = document.createElement('a-select-test')
    document.body.appendChild(el)
    ;(el as unknown as { options: unknown[] }).options = ['a', 'b']

    const onChange = vi.fn()
    el.addEventListener('change', (e) => onChange((e as CustomEvent).detail))

    const second = el.querySelectorAll<HTMLElement>('.vselect-option')[1]!
    second.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))

    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('honours the `disabled` attribute', () => {
    el = document.createElement('a-select-test')
    el.setAttribute('disabled', '')
    document.body.appendChild(el)
    ;(el as unknown as { options: unknown[] }).options = ['a']

    const onOpen = vi.fn()
    el.addEventListener('open', onOpen)
    const control = el.querySelector<HTMLElement>('.vselect-control')!
    control.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))

    expect(onOpen).not.toHaveBeenCalled()
  })
})
