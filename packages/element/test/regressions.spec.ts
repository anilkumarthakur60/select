import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { defineSelectElement } from '@/index'

// Regressions for the W4 audit findings. Each fails against the previous release.

beforeAll(() => {
  defineSelectElement('a-select-regressions')
})

let el: HTMLElement & { options?: unknown; value?: unknown }

afterEach(() => {
  el?.remove()
})

function create(): HTMLElement & { options?: unknown; value?: unknown } {
  el = document.createElement('a-select-regressions')
  document.body.appendChild(el)
  return el
}

const mousedown = () => new MouseEvent('mousedown', { bubbles: true, cancelable: true })

describe('HTML injection', () => {
  // Labels were escaped but the option id was interpolated raw into the `id`
  // attribute  and ids embed the option value. Option lists routinely come
  // from an API or CMS, so this was a live XSS sink. React and Vue build DOM
  // through their renderers, so only this adapter was exploitable.
  it('does not let an option value break out of the id attribute', () => {
    const node = create()
    node.options = [{ value: '" data-injected="yes', label: 'Safe label' }]

    expect(node.innerHTML).not.toContain('data-injected="yes"')
    expect(node.querySelector('[data-injected]')).toBeNull()
  })

  it('does not construct markup from an option value', () => {
    const node = create()
    node.options = [{ value: '"><img src=x onerror=alert(1)>', label: 'x' }]

    expect(node.querySelector('img')).toBeNull()
  })
})

describe('focus across re-render', () => {
  // render() replaces the whole subtree on every notify(), including the
  // focused input. Merely tabbing in re-rendered (focusin flips state.focused
  // and notifies), so focus fell to <body> on every interaction  the element
  // was entirely keyboard-inoperable.
  it('keeps focus when focusin triggers a re-render', () => {
    const node = create()
    node.options = ['alpha', 'beta']

    node.querySelector<HTMLInputElement>('input.vselect-search')!.focus()

    expect(document.activeElement).toBe(node.querySelector('input.vselect-search'))
  })

  it('keeps focus and the query while typing', () => {
    const node = create()
    node.options = ['alpha', 'beta']

    const input = node.querySelector<HTMLInputElement>('input.vselect-search')!
    input.focus()
    input.value = 'al'
    input.dispatchEvent(new Event('input', { bubbles: true }))

    const after = node.querySelector<HTMLInputElement>('input.vselect-search')!
    expect(document.activeElement).toBe(after)
    // Previously the second character went to <body> and the query stuck at one.
    expect(after.value).toBe('al')
  })

  it('preserves the caret position', () => {
    const node = create()
    node.options = ['alpha']

    const input = node.querySelector<HTMLInputElement>('input.vselect-search')!
    input.focus()
    input.value = 'alpha'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    const restored = node.querySelector<HTMLInputElement>('input.vselect-search')!
    restored.setSelectionRange(2, 2)
    restored.value = 'alXpha'
    restored.dispatchEvent(new Event('input', { bubbles: true }))

    const final = node.querySelector<HTMLInputElement>('input.vselect-search')!
    // Restoring focus without the caret would jump the cursor to 0 mid-word.
    expect(final.selectionStart).not.toBe(0)
  })
})

describe('tag removal', () => {
  // Tags carried data-value="${String(o.value)}" and removal resolved with
  // find(o => String(o.value) === value). Every object-valued tag stringified
  // to "[object Object]", so find() always returned the FIRST selected option:
  // clicking × on "Gamma" removed "Alpha", and `deselect` reported the wrong one.
  it('removes the tag that was clicked, for object values', () => {
    const node = create()
    node.setAttribute('mode', 'multiple')
    const options = [
      { value: { id: 1 }, label: 'Alpha' },
      { value: { id: 2 }, label: 'Beta' },
      { value: { id: 3 }, label: 'Gamma' },
    ]
    node.options = options
    node.value = options.map((o) => o.value)

    const buttons = node.querySelectorAll('.vselect-tag-remove')
    buttons[2]!.dispatchEvent(mousedown())

    const remaining = [...node.querySelectorAll('.vselect-tag-label')].map((n) => n.textContent)
    expect(remaining).toEqual(['Alpha', 'Beta'])
  })

  it('reports the removed option in the deselect event', () => {
    const node = create()
    node.setAttribute('mode', 'multiple')
    const options = [
      { value: { id: 1 }, label: 'Alpha' },
      { value: { id: 2 }, label: 'Beta' },
    ]
    node.options = options
    node.value = options.map((o) => o.value)

    const seen: unknown[] = []
    node.addEventListener('deselect', (e) => seen.push((e as CustomEvent).detail?.label))

    node.querySelectorAll('.vselect-tag-remove')[1]!.dispatchEvent(mousedown())
    expect(seen).toEqual(['Beta'])
  })
})

describe('remount', () => {
  // disconnectedCallback tore the wiring down unconditionally, but
  // connectedCallback re-established it only behind `if (!this.machine)` 
  // still truthy on re-connect. The machine kept working while the DOM stopped
  // updating: state and UI silently desynced. Triggered by v-if, list
  // reordering, or moving a node into a portal.
  it('still updates the DOM after unmount and re-append', () => {
    const node = create()
    node.options = ['alpha', 'beta']

    node.remove()
    document.body.appendChild(node)

    node.querySelector('.vselect-control')!.dispatchEvent(mousedown())
    const rows = node.querySelectorAll('[role="option"]')
    rows[1]!.dispatchEvent(mousedown())

    expect(node.querySelector('.vselect-single')?.textContent).toBe('beta')
  })
})
