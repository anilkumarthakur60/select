import { createSelectMachine, type SelectMachine } from '@anil-labs/select-core'
import type { OptionLike } from '@anil-labs/select-core'

// Web Component adapter — covers every framework that doesn't get a
// dedicated package: Angular, Lit, Alpine, vanilla JS, Astro, Qwik, etc.
// The element is registered as <a-select> by default; consumers wanting a
// different tag can call `defineSelectElement('my-select')` themselves.
//
// Limitations vs. native framework adapters:
//   - Tree-select is not supported (Vue adapter only)
//   - Slots are real DOM <slot> elements, not framework idioms
//   - Options are passed via the `options` property (not attribute) when
//     they are objects — strings/numbers can come via attributes or text
//   - Events are dispatched as CustomEvents on the element; listen via
//     `el.addEventListener('change', ...)` etc.
//
// SSR / Node import safety: `class extends HTMLElement` evaluates at module
// load, and `HTMLElement` is undefined outside the browser. Falling back to
// a no-op base class lets the module import cleanly in Node so consumers
// can `import` it from SSR-rendered code without crashing — actual element
// behaviour still requires a browser/jsdom runtime via `defineSelectElement`.
const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement !== 'undefined' ? HTMLElement : (class {} as unknown as typeof HTMLElement)

export class SelectElement extends HTMLElementBase {
  static get observedAttributes(): string[] {
    return [
      'mode',
      'placeholder',
      'disabled',
      'loading',
      'searchable',
      'clearable',
      'taggable',
      'aria-label',
      'size',
      'theme',
      'empty-text',
      'no-results-text',
      'loading-text',
    ]
  }

  private machine!: SelectMachine<OptionLike>
  private unsubscribe: (() => void) | null = null
  private rendered = false
  private boundFocusIn: ((event: FocusEvent) => void) | null = null
  private boundFocusOut: ((event: FocusEvent) => void) | null = null

  // Public properties consumers can set programmatically. Setting these
  // re-pushes config into the machine.
  private _options: OptionLike[] = []
  get options(): OptionLike[] {
    return this._options
  }
  set options(value: OptionLike[]) {
    this._options = value
    this.pushConfig()
  }

  private _value: unknown = null
  get value(): unknown {
    return this._value
  }
  set value(v: unknown) {
    this._value = v
    this.pushConfig()
  }

  connectedCallback(): void {
    if (!this.machine) {
      this.machine = createSelectMachine<OptionLike>(this.collectConfig())
      this.unsubscribe = this.machine.subscribe(() => this.render())
      this.boundFocusIn = (event) => this.machine.handleRootFocusin(event)
      this.boundFocusOut = (event) => this.machine.handleRootFocusout(event)
      this.addEventListener('focusin', this.boundFocusIn)
      this.addEventListener('focusout', this.boundFocusOut)
    }
    this.render()
    this.rendered = true
  }

  disconnectedCallback(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
    if (this.boundFocusIn) this.removeEventListener('focusin', this.boundFocusIn)
    if (this.boundFocusOut) this.removeEventListener('focusout', this.boundFocusOut)
    this.boundFocusIn = null
    this.boundFocusOut = null
  }

  attributeChangedCallback(): void {
    if (!this.machine) return
    this.pushConfig()
  }

  private collectConfig() {
    const attr = (name: string) => this.getAttribute(name) ?? undefined
    const boolAttr = (name: string) => this.hasAttribute(name)
    return {
      options: this._options,
      modelValue: this._value,
      mode: (attr('mode') as 'single' | 'multiple' | 'tags' | undefined) ?? 'single',
      placeholder: attr('placeholder'),
      disabled: boolAttr('disabled'),
      loading: boolAttr('loading'),
      searchable: !this.hasAttribute('no-search'),
      clearable: !this.hasAttribute('no-clear'),
      taggable: boolAttr('taggable'),
      ariaLabel: attr('aria-label'),
      size: (attr('size') as 'sm' | 'md' | 'lg' | undefined) ?? 'md',
      theme: (attr('theme') as 'light' | 'dark' | 'auto' | undefined) ?? 'light',
      emptyText: attr('empty-text'),
      noResultsText: attr('no-results-text'),
      loadingText: attr('loading-text'),
      onChange: (value: unknown) => {
        this._value = value
        this.dispatchEvent(new CustomEvent('change', { detail: value }))
      },
      onOpen: () => this.dispatchEvent(new CustomEvent('open')),
      onClose: () => this.dispatchEvent(new CustomEvent('close')),
      onSelect: (option: unknown) =>
        this.dispatchEvent(new CustomEvent('select', { detail: option })),
      onDeselect: (option: unknown) =>
        this.dispatchEvent(new CustomEvent('deselect', { detail: option })),
      onCreate: (query: string) => this.dispatchEvent(new CustomEvent('create', { detail: query })),
      onSearch: (query: string) => this.dispatchEvent(new CustomEvent('search', { detail: query })),
    }
  }

  private pushConfig() {
    if (!this.machine) return
    this.machine.update(this.collectConfig())
    if (this.rendered) this.render()
  }

  private render(): void {
    const machine = this.machine
    const state = machine.getState()
    const filtered = machine.getFilteredOptions()
    const selected = machine.getSelectedOptions()
    const isMulti = machine.isMulti()

    const root = machine.getRootProps()
    const control = machine.getControlProps()
    const menu = machine.getMenuProps()
    const search = machine.getSearchProps()

    this.className = root.class
    if (root['data-disabled'] !== undefined) this.setAttribute('data-disabled', '')
    else this.removeAttribute('data-disabled')

    // Naive innerHTML render. Real production WC would use template + diffing,
    // but for a select this small the cost is negligible and no shadow DOM
    // means consumer styles apply directly.
    this.innerHTML = `
      <div class="vselect-control" id="${control.id}" role="${control.role}"
           aria-expanded="${control['aria-expanded']}"
           aria-controls="${control['aria-controls']}"
           aria-haspopup="${control['aria-haspopup']}"
           ${control['aria-disabled'] ? 'aria-disabled' : ''}
           ${control['aria-label'] ? `aria-label="${escapeAttr(control['aria-label'])}"` : ''}
           ${control['aria-activedescendant'] ? `aria-activedescendant="${control['aria-activedescendant']}"` : ''}
           tabindex="${control.tabindex}">
        <div class="vselect-values">
          ${
            isMulti
              ? selected
                  .map(
                    (o) =>
                      `<span class="vselect-tag" data-value="${escapeAttr(String(o.value))}">
                         <span class="vselect-tag-label">${escapeText(o.label)}</span>
                         <button type="button" class="vselect-tag-remove" aria-label="Remove" tabindex="-1" data-action="remove" data-value="${escapeAttr(String(o.value))}">×</button>
                       </span>`,
                  )
                  .join('')
              : selected[0] && !state.query
                ? `<span class="vselect-single">${escapeText(selected[0].label)}</span>`
                : ''
          }
          <input class="vselect-search" type="text" autocomplete="off" spellcheck="false"
                 id="${search.id}"
                 value="${escapeAttr(state.query)}"
                 placeholder="${escapeAttr(search.placeholder ?? '')}"
                 ${search.disabled ? 'disabled' : ''}
                 aria-controls="${search['aria-controls']}"
                 aria-autocomplete="${search['aria-autocomplete']}"
                 ${search['aria-activedescendant'] ? `aria-activedescendant="${search['aria-activedescendant']}"` : ''} />
        </div>
        <div class="vselect-indicators">
          ${
            machine.hasSelection() && !this.hasAttribute('no-clear')
              ? `<button type="button" class="vselect-indicator" aria-label="Clear" tabindex="-1" data-action="clear">×</button>`
              : ''
          }
          <span class="vselect-indicator" aria-hidden="true">▾</span>
        </div>
      </div>
      <div class="vselect-menu" id="${menu.id}" role="${menu.role}" aria-multiselectable="${menu['aria-multiselectable']}" ${menu.hidden ? 'hidden' : ''}>
        ${
          filtered.length === 0
            ? `<div class="vselect-empty">${escapeText(machine.emptyMessage())}</div>`
            : filtered
                .map((option, index) => {
                  const op = machine.getOptionProps(option, index)
                  return `<div class="${op.class}" id="${op.id}" role="${op.role}"
                              aria-selected="${op['aria-selected']}"
                              ${op['aria-disabled'] ? 'aria-disabled' : ''}
                              data-action="select" data-index="${index}">${escapeText(option.label)}</div>`
                })
                .join('')
        }
        ${
          machine.showCreate()
            ? `<div class="vselect-create" role="option" data-action="create">Create <strong>${escapeText(state.query)}</strong></div>`
            : ''
        }
      </div>
    `

    // Wire events. We re-bind on every render — innerHTML wipes existing
    // listeners. For larger lists a stable DOM + event delegation would be
    // faster, but a single delegated handler on the root is enough here.
    this.onmousedown = (event) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const action =
        target.dataset.action ?? target.closest<HTMLElement>('[data-action]')?.dataset.action
      if (action === 'remove') {
        const value = target.dataset.value
        const opt = selected.find((o) => String(o.value) === value)
        if (opt) {
          event.preventDefault()
          machine.deselectOption(opt)
        }
        return
      }
      if (action === 'clear') {
        event.preventDefault()
        machine.clear()
        return
      }
      if (action === 'select') {
        const idx = Number(target.dataset.index)
        const opt = filtered[idx]
        if (opt) {
          event.preventDefault()
          machine.selectOption(opt)
        }
        return
      }
      if (action === 'create') {
        event.preventDefault()
        machine.createFromQuery()
        return
      }
      // Click landed on the control itself (background) — toggle.
      if (target.closest('.vselect-control')) {
        event.preventDefault()
        machine.toggle()
      }
    }

    const input = this.querySelector<HTMLInputElement>('input.vselect-search')
    if (input) {
      input.oninput = (event) => machine.handleSearchInput(event)
      input.onkeydown = (event) => machine.handleSearchKeydown(event)
    }
  }
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Register the element under a custom tag name. Defaults to `a-select`.
 * No-op if the tag is already registered.
 */
export function defineSelectElement(tag = 'a-select'): void {
  if (typeof customElements === 'undefined') return
  if (customElements.get(tag)) return
  customElements.define(tag, SelectElement)
}

export * from '@anil-labs/select-core'
