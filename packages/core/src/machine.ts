import { normalize } from '@/normalize'
import { isPrimitive, readAccessor, safeLabel } from '@/accessor'
import { valuesEqual } from '@/compare'
import { defaultFilter } from '@/filter'
import type {
  NormalizedOption,
  OptionAccessor,
  OptionLike,
  SelectMode,
  SelectSize,
  SelectTheme,
} from '@/types/option'
import type { FilterFn } from '@/types/filter'

// Framework-agnostic select state machine.
//
// The Vue adapter has its own implementation (composables) for historical
// reasons — this machine drives the React, Svelte, Solid, and Web Component
// adapters. Tree-select is intentionally out of scope here; consumers needing
// hierarchical selection should use the Vue adapter for now.
//
// Reactivity: pull-based via getState() + subscribe(). Each adapter wires its
// framework's reactive primitive around subscribe so re-renders fire when the
// machine's snapshot changes. This is the same pattern used by Floating UI,
// Zustand, and Ark UI.

let machineCounter = 0
function generateId(prefix: string): string {
  machineCounter += 1
  return `${prefix}-${machineCounter}`
}

export interface SelectMachineConfig<T extends OptionLike = OptionLike> {
  options?: T[]
  mode?: SelectMode
  /** When provided, the machine runs *controlled* — internal selectedValues mirrors this. */
  modelValue?: unknown

  optionValue?: string | ((option: T) => unknown)
  optionLabel?: string | ((option: T) => string)
  optionGroup?: string | ((option: T) => string | undefined)
  optionDisabled?: string | ((option: T) => boolean)

  searchable?: boolean
  clearable?: boolean
  disabled?: boolean
  loading?: boolean
  closeOnSelect?: boolean
  taggable?: boolean
  maxSelections?: number
  caseSensitive?: boolean
  filter?: FilterFn<T>

  size?: SelectSize
  theme?: SelectTheme

  placeholder?: string
  emptyText?: string
  noResultsText?: string
  loadingText?: string
  ariaLabel?: string

  id?: string

  onChange?: (value: unknown) => void
  onOpen?: () => void
  onClose?: () => void
  onSelect?: (option: NormalizedOption<T>) => void
  onDeselect?: (option: NormalizedOption<T>) => void
  onCreate?: (query: string) => void
  onSearch?: (query: string) => void
  onFocus?: (event: FocusEvent) => void
  onBlur?: (event: FocusEvent) => void
}

export interface SelectState {
  query: string
  isOpen: boolean
  activeIndex: number
  selectedValues: unknown[]
  focused: boolean
}

export interface RootProps {
  class: string
  'data-disabled': string | undefined
  onFocusin: (event: FocusEvent) => void
  onFocusout: (event: FocusEvent) => void
}

export interface ControlProps {
  id: string
  role: 'combobox'
  'aria-expanded': boolean
  'aria-controls': string
  'aria-haspopup': 'listbox'
  'aria-disabled': boolean | undefined
  'aria-required': boolean | undefined
  'aria-label': string | undefined
  'aria-activedescendant': string | undefined
  tabindex: number
  onMousedown: (event: MouseEvent) => void
  onKeydown: (event: KeyboardEvent) => void
}

export interface MenuProps {
  id: string
  role: 'listbox'
  'aria-multiselectable': boolean
  hidden: boolean
}

export interface SearchProps {
  id: string
  type: 'text'
  autocomplete: 'off'
  spellcheck: false
  value: string
  placeholder: string | undefined
  disabled: boolean
  'aria-controls': string
  'aria-autocomplete': 'list'
  'aria-activedescendant': string | undefined
  onInput: (event: Event) => void
  onKeydown: (event: KeyboardEvent) => void
}

export interface OptionProps {
  id: string
  role: 'option'
  'aria-selected': boolean
  'aria-disabled': boolean | undefined
  class: string
  onMousedown: (event: MouseEvent) => void
  onMouseenter: () => void
}

export interface ClearButtonProps {
  type: 'button'
  'aria-label': string
  tabindex: -1
  onMousedown: (event: MouseEvent) => void
}

export interface SelectMachine<T extends OptionLike = OptionLike> {
  getState(): SelectState
  /**
   * Monotonically increases on every state mutation. The intended use is as
   * the snapshot for `useSyncExternalStore`-style reactivity: returning a
   * primitive that changes on every notify lets React (and any other
   * snapshot-comparing reactivity layer) detect change without us
   * allocating a fresh state object on every read.
   */
  getVersion(): number
  subscribe(listener: () => void): () => void
  update(partial: Partial<SelectMachineConfig<T>>): void

  getNormalizedOptions(): NormalizedOption<T>[]
  getFilteredOptions(): NormalizedOption<T>[]
  getSelectedOptions(): NormalizedOption<T>[]
  isMulti(): boolean
  isSelected(option: NormalizedOption<T>): boolean
  hasSelection(): boolean
  showCreate(): boolean
  emptyMode(): 'no-options' | 'no-results'
  emptyMessage(): string

  open(): void
  close(): void
  toggle(): void
  setQuery(query: string): void
  selectOption(option: NormalizedOption<T>): void
  deselectOption(option: NormalizedOption<T>): void
  clear(): void
  moveActive(delta: number): void
  moveActiveTo(index: number): void
  moveActiveFirst(): void
  moveActiveLast(): void
  selectActive(): void
  createFromQuery(): void

  handleControlMousedown(event: MouseEvent): void
  handleSearchInput(event: Event): void
  handleSearchKeydown(event: KeyboardEvent): void
  handleControlKeydown(event: KeyboardEvent): void
  handleClearMousedown(event: MouseEvent): void
  handleOptionMousedown(option: NormalizedOption<T>, event: MouseEvent): void
  handleOptionMouseenter(index: number): void
  handleRootFocusin(event: FocusEvent): void
  handleRootFocusout(event: FocusEvent): void

  getRootProps(): RootProps
  getControlProps(): ControlProps
  getMenuProps(): MenuProps
  getSearchProps(): SearchProps
  getOptionProps(option: NormalizedOption<T>, index: number): OptionProps
  getClearButtonProps(): ClearButtonProps

  ids: {
    base: string
    listbox: string
    search: string
    option: (optionId: string) => string
  }
}

export function createSelectMachine<T extends OptionLike = OptionLike>(
  initial: SelectMachineConfig<T> = {},
): SelectMachine<T> {
  let config: SelectMachineConfig<T> = { ...initial }
  const baseId = config.id ?? generateId('select')
  const listboxId = `${baseId}-listbox`
  const searchId = `${baseId}-search`

  const state: SelectState = {
    query: '',
    isOpen: false,
    activeIndex: -1,
    selectedValues: toArray(config.modelValue),
    focused: false,
  }

  const listeners = new Set<() => void>()
  let version = 0
  const notify = () => {
    version += 1
    for (const l of listeners) l()
  }

  // -------- helpers --------

  /**
   * Normalises an *incoming* modelValue. The `value === ''` carve-out is for
   * forms that initialise a select with an empty string meaning "nothing
   * chosen" — it must NOT be applied to values the machine emits, or an option
   * legitimately valued `''` (the native-`<select>` "any / no preference"
   * sentinel) is emitted and then immediately forgotten.
   */
  function toArray(value: unknown): unknown[] {
    if (value == null || value === '') return []
    return Array.isArray(value) ? value : [value]
  }

  /**
   * Normalises a value the machine itself just produced. Same as `toArray`
   * minus the empty-string carve-out: only `null`/`undefined` mean "cleared".
   */
  function toSelectedValues(value: unknown): unknown[] {
    if (value == null) return []
    return Array.isArray(value) ? value : [value]
  }

  function isMulti(): boolean {
    return (config.mode ?? 'single') !== 'single'
  }

  function closeOnSelectResolved(): boolean {
    return config.closeOnSelect ?? (config.mode ?? 'single') === 'single'
  }

  function taggableResolved(): boolean {
    return Boolean(config.taggable) || config.mode === 'tags'
  }

  function emitChange(next: unknown) {
    state.selectedValues = toSelectedValues(next)
    // Record what we just emitted as the current modelValue. `update()` diffs
    // an incoming modelValue against `config.modelValue`; leaving it stale
    // meant a controlled parent could never RE-ASSERT the value it last
    // passed. A parent that validates and rejects a change, reverts after a
    // failed save, or resets a form to its initial value pushed the same
    // modelValue back, the diff saw "no change", and the machine kept its own
    // selection forever — the UI showed the rejected option indefinitely.
    config = { ...config, modelValue: next }
    config.onChange?.(next)
    notify()
  }

  // -------- derived (recomputed on demand) --------

  function getNormalizedOptions(): NormalizedOption<T>[] {
    return normalize(config.options ?? [], {
      optionValue: config.optionValue,
      optionLabel: config.optionLabel,
      optionGroup: config.optionGroup,
      optionDisabled: config.optionDisabled,
    } as Parameters<typeof normalize<T>>[1])
  }

  function getFilteredOptions(): NormalizedOption<T>[] {
    const opts = getNormalizedOptions()
    const q = state.query.trim()
    if (!q) return opts
    const fn = config.filter
    const cs = config.caseSensitive ?? false
    return opts.filter((option) => (fn ? fn({ query: q, option }) : defaultFilter(q, option, cs)))
  }

  function getSelectedSet(): Set<unknown> {
    return new Set(state.selectedValues)
  }

  // Last normalised option seen for a given selected value. The documented
  // async pattern replaces `:options` on every search response (and empties it
  // when the query clears), which used to turn an already-chosen "Ada
  // Lovelace" back into the raw id "u_8f21c" the instant its option vanished.
  // The machine cannot re-derive a label it was never given, so it remembers
  // the one it had. Pruned to the current selection on every read, so it
  // cannot grow without bound.
  const lastKnownOption = new Map<unknown, NormalizedOption<T>>()

  function getSelectedOptions(): NormalizedOption<T>[] {
    const lookup = new Map<unknown, NormalizedOption<T>>()
    for (const option of getNormalizedOptions()) lookup.set(option.value, option)

    const result = state.selectedValues.map((v, index) => {
      const found = lookup.get(v)
      if (found) {
        lastKnownOption.set(v, found)
        return found
      }
      const remembered = lastKnownOption.get(v)
      if (remembered) return remembered

      // Genuinely unknown value: resolve its label through the SAME accessors
      // normalize() uses, rather than a hardcoded `label ?? name` chain that
      // ignored a configured `optionLabel` and yielded '' for any other shape.
      const rawLabel = readAccessor<T, unknown>(
        v as T,
        // SelectMachineConfig types its accessors as `string | fn` while
        // OptionAccessor is `keyof T | fn`; the normalize() call below casts
        // for the same reason.
        config.optionLabel as OptionAccessor<T, unknown> | undefined,
        isPrimitive(v)
          ? v
          : ((v as Record<string, unknown> | null)?.label ??
              (v as Record<string, unknown> | null)?.name),
      )
      return {
        // Index-qualified: the id used to be derived from the label, so every
        // value that resolved to an empty label collided on `synthetic-`, and
        // React logged duplicate-key warnings for tags keyed on it.
        id: `synthetic-${index}`,
        value: v,
        label: safeLabel(rawLabel, v, 'getSelectedOptions'),
        raw: v as T,
      } satisfies NormalizedOption<T>
    })

    for (const key of lastKnownOption.keys()) {
      if (!state.selectedValues.some((v) => valuesEqual(v, key))) lastKnownOption.delete(key)
    }
    return result
  }

  function isSelected(option: NormalizedOption<T>): boolean {
    return getSelectedSet().has(option.value)
  }

  function hasSelection(): boolean {
    return state.selectedValues.length > 0
  }

  function showCreate(): boolean {
    if (!taggableResolved()) return false
    // Trim to agree with getFilteredOptions(), which already trims. Untrimmed,
    // a whitespace-only query was truthy and creatable, so Enter emitted
    // onCreate('   ') and produced a blank tag; and "Vue " offered to create a
    // second "Vue" while the real one was still listed.
    const q = state.query.trim()
    if (!q) return false
    const filtered = getFilteredOptions()
    return !filtered.some((o) => o.label.toLowerCase() === q.toLowerCase())
  }

  /** The visible option whose label exactly matches the trimmed query, if any. */
  function exactQueryMatch(): NormalizedOption<T> | undefined {
    const q = state.query.trim().toLowerCase()
    if (!q) return undefined
    return getFilteredOptions().find((o) => o.label.toLowerCase() === q && !o.disabled)
  }

  function emptyMode(): 'no-options' | 'no-results' {
    return state.query ? 'no-results' : 'no-options'
  }

  function emptyMessage(): string {
    if (state.query) return config.noResultsText ?? config.emptyText ?? 'No options'
    return config.emptyText ?? 'No options'
  }

  function resolveDefaultActiveIndex(): number {
    const visible = getFilteredOptions()
    if (visible.length === 0) return -1
    const sel = getSelectedSet()
    const selectedIdx = visible.findIndex((o) => sel.has(o.value) && !o.disabled)
    if (selectedIdx !== -1) return selectedIdx
    return visible.findIndex((o) => !o.disabled)
  }

  // -------- actions --------

  function open() {
    if (config.disabled) return
    if (state.isOpen) return
    state.isOpen = true
    if (state.activeIndex === -1) state.activeIndex = resolveDefaultActiveIndex()
    config.onOpen?.()
    notify()
  }

  function close() {
    if (!state.isOpen) return
    state.isOpen = false
    state.activeIndex = -1
    config.onClose?.()
    notify()
  }

  function toggle() {
    if (state.isOpen) close()
    else open()
  }

  function setQuery(q: string) {
    if (state.query === q) return
    state.query = q
    state.activeIndex = -1
    config.onSearch?.(q)
    notify()
  }

  function selectOption(option: NormalizedOption<T>) {
    if (option.disabled) return
    // Remember the resolved option now, while we still have it: the async
    // pattern replaces `:options` right after a pick, and getSelectedOptions()
    // only caches what it sees on a read.
    lastKnownOption.set(option.value, option)
    const wasSelected = isSelected(option)
    if (!isMulti()) {
      if (!wasSelected) {
        emitChange(option.value)
        config.onSelect?.(option)
      }
      if (closeOnSelectResolved()) close()
      state.query = ''
      notify()
      return
    }
    const cap = config.maxSelections
    if (!wasSelected && cap !== undefined && state.selectedValues.length >= cap) return
    const next = wasSelected
      ? state.selectedValues.filter((v) => !valuesEqual(v, option.value))
      : [...state.selectedValues, option.value]
    emitChange(next)
    if (wasSelected) config.onDeselect?.(option)
    else config.onSelect?.(option)
    if (closeOnSelectResolved()) close()
    state.query = ''
    notify()
  }

  function deselectOption(option: NormalizedOption<T>) {
    if (!isMulti()) {
      emitChange(null)
    } else {
      emitChange(state.selectedValues.filter((v) => !valuesEqual(v, option.value)))
    }
    config.onDeselect?.(option)
  }

  function clear() {
    if (state.selectedValues.length === 0) return
    const cleared = getSelectedOptions()
    emitChange(isMulti() ? [] : null)
    for (const option of cleared) config.onDeselect?.(option)
    state.query = ''
    notify()
  }

  function moveActive(delta: number) {
    const visible = getFilteredOptions()
    const len = visible.length
    if (len === 0) {
      state.activeIndex = -1
      notify()
      return
    }
    let i = state.activeIndex
    if (i < 0) i = delta > 0 ? -1 : len
    for (let step = 0; step < len; step += 1) {
      i = (i + delta + len) % len
      if (!visible[i]!.disabled) {
        state.activeIndex = i
        notify()
        return
      }
    }
    // Every visible option is disabled. Falling out of the loop silently left
    // a stale index behind — a disabled row kept rendering as active, Enter on
    // it preventDefault-ed and selected nothing, and no adapter re-rendered
    // because notify() never fired.
    state.activeIndex = -1
    notify()
  }

  function moveActiveTo(index: number) {
    state.activeIndex = index
    notify()
  }

  function moveActiveFirst() {
    const visible = getFilteredOptions()
    const idx = visible.findIndex((o) => !o.disabled)
    state.activeIndex = idx
    notify()
  }

  function moveActiveLast() {
    const visible = getFilteredOptions()
    for (let i = visible.length - 1; i >= 0; i -= 1) {
      if (!visible[i]!.disabled) {
        state.activeIndex = i
        notify()
        return
      }
    }
    // No enabled option — clear rather than leaving a stale index. See moveActive().
    state.activeIndex = -1
    notify()
  }

  function selectActive() {
    const visible = getFilteredOptions()
    const option = visible[state.activeIndex]
    if (!option) return
    selectOption(option)
  }

  function createFromQuery() {
    // Trimmed, so the created tag is the same string the user sees offered —
    // and a whitespace-only query creates nothing at all.
    const q = state.query.trim()
    if (!taggableResolved() || !q) return
    config.onCreate?.(q)
    state.query = ''
    notify()
  }

  function deselectLast() {
    if (!isMulti() || state.selectedValues.length === 0) return
    const last = state.selectedValues[state.selectedValues.length - 1]
    const next = state.selectedValues.slice(0, -1)
    emitChange(next)
    const lookup = new Map<unknown, NormalizedOption<T>>()
    for (const option of getNormalizedOptions()) lookup.set(option.value, option)
    const opt = lookup.get(last)
    if (opt) config.onDeselect?.(opt)
  }

  // -------- DOM event handlers --------

  function handleControlMousedown(event: MouseEvent) {
    if (config.disabled) return
    // Prevent the focus-grab from a click stealing focus from the (possibly
    // hidden) search input — adapter's render decides the actual focus target.
    event.preventDefault()
    toggle()
  }

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement | null
    setQuery(target?.value ?? '')
    if (!state.isOpen) open()
  }

  function handleSearchKeydown(event: KeyboardEvent) {
    handleKeydownCore(event, true)
  }

  function handleControlKeydown(event: KeyboardEvent) {
    handleKeydownCore(event, false)
  }

  function handleKeydownCore(event: KeyboardEvent, fromSearch: boolean) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!state.isOpen) open()
        else moveActive(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!state.isOpen) open()
        else moveActive(-1)
        break
      case 'Home':
        if (state.isOpen) {
          event.preventDefault()
          moveActiveFirst()
        }
        break
      case 'End':
        if (state.isOpen) {
          event.preventDefault()
          moveActiveLast()
        }
        break
      case 'Enter': {
        if (!state.isOpen) {
          event.preventDefault()
          open()
          break
        }
        // Resolve what Enter would actually DO before consuming the key. The
        // old branch tested `activeIndex >= 0` and called preventDefault()
        // unconditionally, so a stale index swallowed form submission and then
        // selected nothing.
        const active = state.activeIndex >= 0 ? getFilteredOptions()[state.activeIndex] : undefined
        if (active) {
          event.preventDefault()
          selectOption(active)
          break
        }
        // In tags mode, typing an exact match shows the real row and NO create
        // row (showCreate() returns false) — but Enter used to fire onCreate
        // anyway, producing a duplicate tag while onChange never fired.
        // setQuery() resets activeIndex to -1, so there is no highlight to
        // fall back on; match the query against the list explicitly.
        const exact = exactQueryMatch()
        if (exact) {
          event.preventDefault()
          selectOption(exact)
          break
        }
        if (showCreate()) {
          event.preventDefault()
          createFromQuery()
        }
        // Otherwise Enter means nothing here — leave the event alone so it can
        // submit the surrounding form.
        break
      }
      case 'Escape':
        if (state.isOpen) {
          event.preventDefault()
          close()
        }
        break
      case 'Tab':
        if (state.isOpen) close()
        break
      case 'Backspace':
        if (fromSearch && !state.query) deselectLast()
        break
      default:
        break
    }
  }

  function handleClearMousedown(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    clear()
  }

  function handleOptionMousedown(option: NormalizedOption<T>, event: MouseEvent) {
    event.preventDefault()
    if (option.disabled) return
    selectOption(option)
  }

  function handleOptionMouseenter(index: number) {
    moveActiveTo(index)
  }

  function handleRootFocusin(event: FocusEvent) {
    if (state.focused) return
    state.focused = true
    config.onFocus?.(event)
    notify()
  }

  function handleRootFocusout(event: FocusEvent) {
    // Defer: focus may be moving to a child. The adapter calls this on
    // focusout; if the relatedTarget is still inside the root we ignore.
    const next = event.relatedTarget as Node | null
    const root = (event.currentTarget as Node | null) ?? null
    if (next && root && root.contains(next)) return
    if (!state.focused) return
    state.focused = false
    config.onBlur?.(event)
    notify()
  }

  // -------- prop builders --------

  function activeOptionId(): string | undefined {
    const opt = getFilteredOptions()[state.activeIndex]
    return opt ? `${baseId}-opt-${opt.id}` : undefined
  }

  function getRootProps(): RootProps {
    const cls = ['vselect', `vselect--${config.size ?? 'md'}`]
    if (config.theme === 'dark') cls.push('vselect--dark')
    if (config.theme === 'auto') cls.push('vselect--auto')
    if (state.isOpen) cls.push('is-open')
    if (state.focused) cls.push('is-focused')
    if (config.disabled) cls.push('is-disabled')
    if (isMulti()) cls.push('is-multi')
    else cls.push('is-single')
    if (config.searchable !== false) cls.push('is-searchable')
    if (config.loading) cls.push('is-loading')
    if (hasSelection()) cls.push('has-value')

    return {
      class: cls.join(' '),
      'data-disabled': config.disabled ? '' : undefined,
      onFocusin: handleRootFocusin,
      onFocusout: handleRootFocusout,
    }
  }

  function getControlProps(): ControlProps {
    return {
      id: baseId,
      role: 'combobox',
      'aria-expanded': state.isOpen,
      'aria-controls': listboxId,
      'aria-haspopup': 'listbox',
      'aria-disabled': config.disabled || undefined,
      'aria-required': undefined,
      'aria-label': config.ariaLabel ?? config.placeholder,
      'aria-activedescendant': activeOptionId(),
      tabindex: config.searchable === false ? (config.disabled ? -1 : 0) : -1,
      onMousedown: handleControlMousedown,
      onKeydown: handleControlKeydown,
    }
  }

  function getMenuProps(): MenuProps {
    return {
      id: listboxId,
      role: 'listbox',
      'aria-multiselectable': isMulti(),
      hidden: !state.isOpen,
    }
  }

  function getSearchProps(): SearchProps {
    return {
      id: searchId,
      type: 'text',
      autocomplete: 'off',
      spellcheck: false,
      value: state.query,
      placeholder: hasSelection() ? undefined : config.placeholder,
      disabled: !!config.disabled,
      'aria-controls': listboxId,
      'aria-autocomplete': 'list',
      'aria-activedescendant': activeOptionId(),
      onInput: handleSearchInput,
      onKeydown: handleSearchKeydown,
    }
  }

  function getOptionProps(option: NormalizedOption<T>, index: number): OptionProps {
    const cls = ['vselect-option']
    if (state.activeIndex === index) cls.push('is-active')
    if (isSelected(option)) cls.push('is-selected')
    if (option.disabled) cls.push('is-disabled')
    return {
      id: `${baseId}-opt-${option.id}`,
      role: 'option',
      'aria-selected': isSelected(option),
      'aria-disabled': option.disabled || undefined,
      class: cls.join(' '),
      onMousedown: (event) => handleOptionMousedown(option, event),
      onMouseenter: () => handleOptionMouseenter(index),
    }
  }

  function getClearButtonProps(): ClearButtonProps {
    return {
      type: 'button',
      'aria-label': 'Clear selection',
      tabindex: -1,
      onMousedown: handleClearMousedown,
    }
  }

  // -------- public --------

  return {
    getState: () => state,
    getVersion: () => version,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    update(partial) {
      // Diff before swapping config so we know whether to notify(). React
      // (and other useSyncExternalStore-style adapters) push config on every
      // render via useEffect; if update() always notifies, useSyncExternalStore
      // re-renders, useEffect fires, update() runs again, infinite loop.
      const observableChange =
        ('options' in partial && partial.options !== config.options) ||
        ('modelValue' in partial && partial.modelValue !== config.modelValue) ||
        ('mode' in partial && partial.mode !== config.mode) ||
        ('disabled' in partial && partial.disabled !== config.disabled) ||
        ('loading' in partial && partial.loading !== config.loading)
      const prevModelValue = config.modelValue
      config = { ...config, ...partial }
      if ('modelValue' in partial && partial.modelValue !== prevModelValue) {
        state.selectedValues = toArray(partial.modelValue)
      }
      // Reconcile the highlight against the new list. `getFilteredOptions()`
      // is recomputed on demand, so after an async result replaced a longer
      // list activeIndex pointed past the end: no row rendered as active,
      // `aria-activedescendant` was undefined (screen readers announced
      // nothing), and Enter still took the "has active index" branch — calling
      // preventDefault(), swallowing form submit, and then selecting nothing.
      // This is the documented async pattern, which replaces `:options` on
      // every search response.
      if (state.isOpen && observableChange) {
        if (state.activeIndex >= getFilteredOptions().length) {
          state.activeIndex = resolveDefaultActiveIndex()
        }
      }
      if (observableChange) notify()
    },

    getNormalizedOptions,
    getFilteredOptions,
    getSelectedOptions,
    isMulti,
    isSelected,
    hasSelection,
    showCreate,
    emptyMode,
    emptyMessage,

    open,
    close,
    toggle,
    setQuery,
    selectOption,
    deselectOption,
    clear,
    moveActive,
    moveActiveTo,
    moveActiveFirst,
    moveActiveLast,
    selectActive,
    createFromQuery,

    handleControlMousedown,
    handleSearchInput,
    handleSearchKeydown,
    handleControlKeydown,
    handleClearMousedown,
    handleOptionMousedown,
    handleOptionMouseenter,
    handleRootFocusin,
    handleRootFocusout,

    getRootProps,
    getControlProps,
    getMenuProps,
    getSearchProps,
    getOptionProps,
    getClearButtonProps,

    ids: {
      base: baseId,
      listbox: listboxId,
      search: searchId,
      option: (optionId: string) => `${baseId}-opt-${optionId}`,
    },
  }
}
