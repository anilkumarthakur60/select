import {
  computed,
  defineComponent,
  ref,
  Teleport,
  watch,
  withModifiers,
  type PropType,
  type SlotsType,
} from 'vue'
import type { FilterFn } from '@anil-labs/select-core'
import type {
  NormalizedOption,
  OptionLike,
  SelectMode,
  SelectSize,
  SelectTheme,
} from '@anil-labs/select-core'
import type { OptionSlotProps, VSelectProps, VSelectSlots } from '@/types'
import { normalize } from '@anil-labs/select-core'
import { useControlFocus } from '@/composables/useControlFocus'
import { useDebounced } from '@/composables/useDebounced'
import { useFloatingMenu } from '@/composables/useFloatingMenu'
import { afterTick } from '@/composables/afterTick'
import { useFormBinding } from '@/composables/useFormBinding'
import { useKeyboardNav } from '@/composables/useKeyboardNav'
import { useMenuState } from '@/composables/useMenuState'
import { useOptionFilter } from '@/composables/useOptionFilter'
import { useOutsideClick } from '@/composables/useOutsideClick'
import { useSelection } from '@/composables/useSelection'
import { useStableId } from '@/composables/useStableId'
import { useTaggable } from '@/composables/useTaggable'
import { useTriggerInteractions } from '@/composables/useTriggerInteractions'
import { ChevronDownIcon, CloseIcon } from '@/components/icons'
import VSelectOption from '@/components/VSelectOption'
import VSelectTag from '@/components/VSelectTag'

type T = OptionLike

interface RenderRow {
  type: 'group' | 'option'
  group?: string
  option?: NormalizedOption<T>
  index?: number
}

export default defineComponent({
  name: 'VSelect',
  inheritAttrs: false,
  props: {
    modelValue: { type: null as unknown as PropType<unknown> },
    options: { type: Array as PropType<T[]>, default: () => [] },
    mode: { type: String as PropType<SelectMode>, default: 'single' },
    // Loosened from `keyof T | (...)` to `string | (...)` because TSX can't
    // carry the SFC `<T extends OptionLike>` generic that originally drove the
    // `keyof T` narrowing.
    //
    // T is genuinely ERASED at this boundary — `VSelectProps<T>` is not an
    // escape hatch that restores it. A `VSelectProps<City>` bag is not
    // assignable to this component's props, because these accessors and
    // `filter` are contravariantly incompatible once T collapses to
    // OptionLike. Wrappers must cast at the hand-off; see docs/api/types.md.
    optionValue: {
      type: [String, Function] as PropType<string | ((option: OptionLike) => unknown)>,
    },
    optionLabel: {
      type: [String, Function] as PropType<string | ((option: OptionLike) => string)>,
    },
    optionGroup: {
      type: [String, Function] as PropType<string | ((option: OptionLike) => string | undefined)>,
    },
    optionDisabled: {
      type: [String, Function] as PropType<string | ((option: OptionLike) => boolean)>,
    },
    placeholder: { type: String, default: 'Select…' },
    searchable: { type: Boolean, default: true },
    clearable: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    // `default: undefined` is REQUIRED here, not decoration. Vue coerces an
    // absent `type: Boolean` prop to `false`, not `undefined`, so the resolver
    // `props.closeOnSelect ?? props.mode === 'single'` below could never reach
    // its right-hand side — it was permanently false, and a default
    // single-select never closed after a pick, leaving the listbox mounted and
    // aria-expanded="true" forever. Every other adapter closed correctly,
    // because the core machine sees a real `undefined`.
    closeOnSelect: { type: Boolean, default: undefined },
    autofocus: { type: Boolean, default: false },
    maxVisibleTags: { type: Number },
    maxSelections: { type: Number },
    taggable: { type: Boolean, default: false },
    filter: { type: Function as PropType<FilterFn<T>> },
    caseSensitive: { type: Boolean, default: false },
    debounce: { type: Number },
    emptyText: { type: String, default: 'No options' },
    noResultsText: { type: String },
    loadingText: { type: String, default: 'Loading…' },
    size: { type: String as PropType<SelectSize>, default: 'md' },
    theme: { type: String as PropType<SelectTheme>, default: 'light' },
    ariaLabel: { type: String },
    teleportTo: {
      type: [String, Object, Boolean] as PropType<string | HTMLElement | false>,
      default: false,
    },
    name: { type: String },
    required: { type: Boolean, default: false },
    id: { type: String },
  },
  emits: {
    'update:modelValue': (_value: unknown) => true,
    'update:search': (_value: string) => true,
    open: () => true,
    close: () => true,
    focus: (_event: FocusEvent) => true,
    blur: (_event: FocusEvent) => true,
    select: (_option: NormalizedOption<unknown>) => true,
    deselect: (_option: NormalizedOption<unknown>) => true,
    create: (_value: string) => true,
    search: (_query: string) => true,
  },
  slots: Object as SlotsType<VSelectSlots<T>>,
  setup(props, { emit, attrs, slots, expose }) {
    // Resolve once in setup — `useStableId` calls `getCurrentInstance()`, which
    // returns null inside a computed getter, so wrapping this in `computed` would
    // produce a fresh anonymous-counter id on every re-evaluation and detach the
    // aria wiring (listbox / activedescendant) from the rendered DOM ids.
    const fallbackId = useStableId('vselect')
    const baseId = computed(() => props.id ?? fallbackId)
    const listboxId = computed(() => `${baseId.value}-listbox`)
    const searchId = computed(() => `${baseId.value}-search`)

    const rootEl = ref<HTMLElement | null>(null)
    const controlEl = ref<HTMLElement | null>(null)
    const menuEl = ref<HTMLElement | null>(null)
    const searchEl = ref<HTMLInputElement | null>(null)

    // `query` is the live input value — kept in sync with the DOM input on
    // every keystroke so typing feels instant. `effectiveQuery` is the value
    // that drives filtering and the `search` / `update:search` emits, debounced
    // when the prop is set. They're the same ref when `debounce` is unset / 0.
    const query = ref('')
    const debounceMs = computed(() => props.debounce)
    const {
      debounced: effectiveQuery,
      flush: flushSearch,
      force: forceSearch,
    } = useDebounced(query, debounceMs)

    const modelRef = computed(() => props.modelValue)
    const modeRef = computed(() => props.mode)
    const maxSelectionsRef = computed(() => props.maxSelections)

    const normalizedOptions = computed<NormalizedOption<T>[]>(() =>
      normalize(props.options, {
        optionValue: props.optionValue as VSelectProps<T>['optionValue'],
        optionLabel: props.optionLabel as VSelectProps<T>['optionLabel'],
        optionGroup: props.optionGroup as VSelectProps<T>['optionGroup'],
        optionDisabled: props.optionDisabled as VSelectProps<T>['optionDisabled'],
      }),
    )

    const { isMulti, selectedValues, selectedOptions, isSelected, select, deselect, clear } =
      useSelection<T>({
        modelValue: modelRef,
        options: normalizedOptions,
        mode: modeRef,
        maxSelections: maxSelectionsRef,
        emitUpdate: (v) => emit('update:modelValue', v),
        emitSelect: (o) => emit('select', o),
        emitDeselect: (o) => emit('deselect', o),
      })

    const { filtered } = useOptionFilter<T>({
      options: normalizedOptions,
      query: effectiveQuery,
      // Wrapped in a computed, mirroring `caseSensitive` on the next line.
      // Passing `props.filter` bare read it once during setup, so swapping the
      // matching strategy at runtime had no effect.
      filter: computed(() => props.filter),
      caseSensitive: computed(() => props.caseSensitive),
    })

    const { isOpen, activeIndex, open, close, toggle } = useMenuState({
      itemsCount: computed(() => filtered.value.length),
    })

    const closeOnSelectResolved = computed(() => props.closeOnSelect ?? props.mode === 'single')

    const taggableRef = computed(() => props.taggable || props.mode === 'tags')

    const { showCreate, createFromQuery: createFromQueryRaw } = useTaggable<T>({
      enabled: taggableRef,
      query,
      filtered,
      onCreate: (value) => emit('create', value),
    })

    function createFromQuery() {
      createFromQueryRaw()
      query.value = ''
      forceSearch('')
    }

    function selectActive() {
      // Commit against the list the user's QUERY implies, not the stale one
      // still on screen. With `debounce` set, typing "Gam" and pressing Enter
      // before the trailing edge committed "Alpha" — the first row of the
      // not-yet-filtered list — so the value that landed in v-model had
      // nothing to do with what was typed. Type-then-Enter is the normal
      // type-ahead flow, so this fired constantly.
      const highlighted = filtered.value[activeIndex.value]
      flushSearch()
      const visible = filtered.value

      // Keep the user's highlight if it survives the newly-applied query;
      // otherwise fall back to the default (selected, else first enabled).
      let idx = highlighted ? visible.findIndex((o) => o.id === highlighted.id) : -1
      if (idx === -1) idx = resolveDefaultActiveIndex()

      const option = visible[idx]
      if (!option) return
      activeIndex.value = idx
      select(option)
      if (closeOnSelectResolved.value) close()
      // Reset the search and skip the debounce — the menu should reflect the
      // selection immediately, not after the next trailing edge.
      query.value = ''
      forceSearch('')
    }

    function deselectLast() {
      if (!isMulti.value) return
      const last = selectedOptions.value[selectedOptions.value.length - 1]
      if (last) deselect(last)
    }

    const { onKeydown } = useKeyboardNav<T>({
      isOpen,
      activeIndex,
      options: filtered,
      open,
      close,
      selectActive,
      deselectLast,
      hasQuery: () => query.value.length > 0,
      taggable: taggableRef,
      createFromQuery,
    })

    const teleportToRef = computed(() => props.teleportTo)
    const {
      styles: floatingStyles,
      target: teleportTarget,
      floating: isFloating,
      update: updateFloating,
    } = useFloatingMenu(controlEl, menuEl, { teleportTo: teleportToRef })

    useOutsideClick({ active: isOpen, contains: [rootEl, menuEl], onOutside: close })

    // Pick the row to land on when the menu opens or its options refresh:
    // prefer the user's current selection so they see *their* choice
    // highlighted, falling back to the first enabled row.
    function resolveDefaultActiveIndex() {
      const visible = filtered.value
      if (visible.length === 0) return -1
      const selectedIdx = visible.findIndex((o) => isSelected(o) && !o.disabled)
      if (selectedIdx !== -1) return selectedIdx
      return visible.findIndex((o) => !o.disabled)
    }

    function scrollActiveIntoView() {
      if (!isOpen.value || !menuEl.value) return
      const opt = filtered.value[activeIndex.value]
      if (!opt) return
      // getElementById, not querySelector(`[id="…"]`): option ids embed the
      // option's value, so a value containing a double quote ('5" nails', a
      // Windows path, a quoted product name) produced an invalid selector and
      // threw SyntaxError out of the nextTick callbacks below, where nothing
      // could catch it. Ids are document-unique, so no selector is needed —
      // and this keeps working when the menu is teleported out of the root.
      const el = document.getElementById(`${baseId.value}-opt-${opt.id}`)
      // jsdom (test env) and some older browsers don't implement scrollIntoView.
      el?.scrollIntoView?.({ block: 'nearest' })
    }

    watch(isOpen, (openVal) => {
      if (openVal) {
        emit('open')
        afterTick(() => {
          if (props.searchable && searchEl.value) searchEl.value.focus()
          if (activeIndex.value === -1) activeIndex.value = resolveDefaultActiveIndex()
          if (isFloating.value) updateFloating()
          scrollActiveIntoView()
        })
      } else {
        emit('close')
      }
    })

    // Re-resolve the active row whenever the visible option set changes — this
    // covers debounced query updates *and* async option arrival (where the
    // parent populates `options` after a fetch resolves).
    watch(
      () => filtered.value,
      () => {
        if (!isOpen.value && activeIndex.value === -1) return
        activeIndex.value = resolveDefaultActiveIndex()
      },
    )

    // Emit search events off the *effective* query so async consumers only see
    // one fire per debounced change, not one per keystroke.
    watch(effectiveQuery, (q) => {
      emit('update:search', q)
      emit('search', q)
    })

    watch(activeIndex, () => {
      if (!isOpen.value) return
      afterTick(scrollActiveIntoView)
    })

    const { onControlMousedown, onSearchInput } = useTriggerInteractions({
      disabled: computed(() => props.disabled),
      searchable: computed(() => props.searchable),
      isOpen,
      searchEl,
      query,
      open,
      toggle,
    })

    const { focused, onFocusIn, onFocusOut } = useControlFocus({
      root: rootEl,
      onFocus: (event) => emit('focus', event),
      onBlur: (event) => emit('blur', event),
    })

    function onOptionPick(option: NormalizedOption<T>) {
      if (option.disabled) return
      select(option)
      if (closeOnSelectResolved.value) {
        close()
        if (props.searchable && searchEl.value) searchEl.value.blur()
      } else if (props.searchable && searchEl.value) {
        searchEl.value.focus()
      }
      query.value = ''
      forceSearch('')
    }

    function onClearClick(event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()
      clear()
      query.value = ''
      forceSearch('')
      if (props.searchable && searchEl.value) searchEl.value.focus()
    }

    /**
     * Keyboard activation of the clear button. The browser delivers Enter and
     * Space on a `<button>` as a `click`, never a `mousedown`, so the
     * mousedown-only handler above was unreachable without a pointer.
     *
     * `event.detail === 0` identifies a keyboard-synthesised click (a real
     * pointer click reports its click-count), so a mouse press does not run
     * both handlers.
     */
    function onClearActivate(event: MouseEvent) {
      if (event.detail !== 0) return
      onClearClick(event)
    }

    /**
     * The browser focuses an invalid control before showing its validation
     * bubble. That control is our visually-hidden validation input, which the
     * user cannot see — so hand focus to the element they can actually
     * interact with.
     */
    function onValidationInputFocus() {
      ;(searchEl.value ?? controlEl.value)?.focus()
    }

    function onTagRemove(option: NormalizedOption<T>) {
      deselect(option)
    }

    const renderRows = computed<RenderRow[]>(() => {
      const rows: RenderRow[] = []
      let lastGroup: string | undefined
      filtered.value.forEach((option, index) => {
        if (option.group && option.group !== lastGroup) {
          rows.push({ type: 'group', group: option.group })
          lastGroup = option.group
        } else if (!option.group) {
          lastGroup = undefined
        }
        rows.push({ type: 'option', option, index })
      })
      return rows
    })

    const visibleTags = computed(() => {
      if (props.maxVisibleTags === undefined) return selectedOptions.value
      return selectedOptions.value.slice(0, props.maxVisibleTags)
    })

    const overflowTagCount = computed(() => {
      if (props.maxVisibleTags === undefined) return 0
      return Math.max(selectedOptions.value.length - props.maxVisibleTags, 0)
    })

    const hasSelection = computed(() => selectedOptions.value.length > 0)

    const emptyMode = computed<'no-options' | 'no-results'>(() =>
      query.value ? 'no-results' : 'no-options',
    )

    const emptyMessage = computed(() => {
      if (query.value) return props.noResultsText ?? props.emptyText
      return props.emptyText
    })

    const rootClass = computed(() => [
      'vselect',
      `vselect--${props.size}`,
      props.theme === 'dark' && 'vselect--dark',
      props.theme === 'auto' && 'vselect--auto',
      {
        'is-open': isOpen.value,
        'is-focused': focused.value,
        'is-disabled': props.disabled,
        'is-multi': isMulti.value,
        'is-single': !isMulti.value,
        'is-searchable': props.searchable,
        'is-loading': props.loading,
        'has-value': hasSelection.value,
      },
    ])

    const activeOptionId = computed(() => {
      const opt = filtered.value[activeIndex.value]
      return opt ? `${baseId.value}-opt-${opt.id}` : undefined
    })

    expose({
      open,
      close,
      toggle,
      // `(a ?? b)?.focus()`, NOT `a?.focus() ?? b?.focus()`. HTMLElement.focus()
      // returns undefined, so the `??` always evaluated its right-hand side:
      // both calls ran and the control div won. Since the control carries
      // tabindex={-1} when searchable and ignores keydown in that mode, the
      // documented `focus()` left the user on an element that accepts neither
      // text nor arrow keys — ArrowDown would not even open the menu.
      focus: () => (searchEl.value ?? controlEl.value)?.focus(),
      blur: () => (searchEl.value ?? controlEl.value)?.blur(),
      clear,
      flushSearch,
      get isOpen() {
        return isOpen.value
      },
    })

    const { hiddenInputs } = useFormBinding({
      name: computed(() => props.name),
      required: computed(() => props.required),
      values: selectedValues,
      isMulti,
    })

    watch(
      () => props.autofocus,
      (auto) => {
        if (auto) afterTick(() => (searchEl.value ?? controlEl.value)?.focus())
      },
      { immediate: true },
    )

    const renderMenu = () => (
      <div
        v-show={isOpen.value}
        id={listboxId.value}
        ref={(el) => {
          menuEl.value = el as HTMLElement | null
        }}
        class={[
          'vselect-menu',
          `vselect--${props.size}`,
          props.theme === 'dark' && 'vselect--dark',
          props.theme === 'auto' && 'vselect--auto',
        ]}
        role="listbox"
        aria-multiselectable={isMulti.value}
        style={floatingStyles.value}
      >
        {props.loading ? (
          slots.loader ? (
            slots.loader({ inMenu: true })
          ) : (
            <div class="vselect-loading">
              <span class="vselect-spinner" />
              <span>{props.loadingText}</span>
            </div>
          )
        ) : renderRows.value.length === 0 ? (
          slots.empty ? (
            slots.empty({ query: query.value, mode: emptyMode.value })
          ) : (
            <div class="vselect-empty">{emptyMessage.value}</div>
          )
        ) : (
          renderRows.value.map((row, i) =>
            row.type === 'group' ? (
              <div key={`g-${i}`} class="vselect-group" role="presentation">
                {slots.optiongroup ? slots.optiongroup({ group: row.group! }) : row.group}
              </div>
            ) : (
              <VSelectOption
                key={`o-${row.option!.id}`}
                option={row.option!}
                selected={isSelected(row.option!)}
                active={activeIndex.value === row.index}
                domId={`${baseId.value}-opt-${row.option!.id}`}
                onHighlight={() => {
                  activeIndex.value = row.index!
                }}
                onPick={onOptionPick}
              >
                {{
                  default: slots.option
                    ? (slotProps: OptionSlotProps<T>) => slots.option!(slotProps)
                    : undefined,
                }}
              </VSelectOption>
            ),
          )
        )}

        {showCreate.value &&
          (slots.create ? (
            slots.create({ query: query.value, create: createFromQuery })
          ) : (
            <div
              class="vselect-create"
              role="option"
              onMousedown={withModifiers(createFromQuery, ['prevent'])}
            >
              Create <strong>{query.value}</strong>
            </div>
          ))}
      </div>
    )

    return () => (
      <div
        ref={(el) => {
          rootEl.value = el as HTMLElement | null
        }}
        class={rootClass.value}
        data-disabled={props.disabled || undefined}
        onFocusin={onFocusIn}
        onFocusout={onFocusOut}
      >
        <div
          ref={(el) => {
            controlEl.value = el as HTMLElement | null
          }}
          class="vselect-control"
          // Under the WAI-ARIA 1.2 combobox pattern the element that RECEIVES
          // FOCUS is the combobox. When `searchable` (the default) that is the
          // search input, not this div — this div carries tabindex={-1} and can
          // never be focused. Declaring role="combobox" here meant a screen
          // reader announced the focused element as a plain edit field and was
          // never told the popup opened or closed. So the semantics live on
          // whichever element is actually focusable: the input when searchable,
          // this div otherwise.
          role={props.searchable ? undefined : 'combobox'}
          aria-expanded={props.searchable ? undefined : isOpen.value}
          aria-controls={props.searchable ? undefined : listboxId.value}
          aria-haspopup={props.searchable ? undefined : 'listbox'}
          aria-disabled={props.searchable ? undefined : props.disabled || undefined}
          aria-required={props.searchable ? undefined : props.required || undefined}
          aria-label={props.searchable ? undefined : (props.ariaLabel ?? props.placeholder)}
          aria-activedescendant={props.searchable ? undefined : activeOptionId.value}
          tabindex={props.searchable ? -1 : props.disabled ? -1 : 0}
          {...attrs}
          onMousedown={onControlMousedown}
          onKeydown={(e: KeyboardEvent) => {
            // `false` = not from the search input, so Backspace does not
            // deselect. Matches the core machine's `fromSearch` gate.
            if (!props.searchable) onKeydown(e, false)
          }}
        >
          {slots.prefix?.()}

          <div class="vselect-values">
            {slots.value && hasSelection.value && !query.value ? (
              slots.value({ selected: selectedOptions.value, isMulti: isMulti.value })
            ) : isMulti.value ? (
              <>
                {visibleTags.value.map((option) =>
                  slots.tag ? (
                    <span key={option.id}>
                      {slots.tag({
                        option,
                        remove: () => deselect(option),
                        disabled: props.disabled,
                      })}
                    </span>
                  ) : (
                    <VSelectTag
                      key={option.id}
                      option={option}
                      disabled={props.disabled}
                      onRemove={onTagRemove}
                    />
                  ),
                )}
                {overflowTagCount.value > 0 && (
                  <span class="vselect-tag vselect-tag--overflow">+{overflowTagCount.value}</span>
                )}
              </>
            ) : hasSelection.value && !query.value ? (
              <span class="vselect-single">{selectedOptions.value[0]?.label}</span>
            ) : null}

            {!hasSelection.value && !query.value && !props.searchable && (
              <span class="vselect-placeholder">{props.placeholder}</span>
            )}

            {props.searchable && (
              <input
                id={searchId.value}
                ref={(el) => {
                  searchEl.value = el as HTMLInputElement | null
                }}
                class={[
                  'vselect-search',
                  { 'is-hidden': !isMulti.value && hasSelection.value && !query.value },
                ]}
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck={false}
                value={query.value}
                placeholder={hasSelection.value ? undefined : props.placeholder}
                disabled={props.disabled}
                // This input is the combobox — it is the element that takes
                // focus. See the comment on the control div above.
                role="combobox"
                aria-expanded={isOpen.value}
                aria-haspopup="listbox"
                aria-controls={listboxId.value}
                aria-autocomplete="list"
                aria-disabled={props.disabled || undefined}
                aria-required={props.required || undefined}
                // Always present, not just while the placeholder shows. The
                // placeholder is stripped once a value is picked, so the
                // focused input was left with NO accessible name at all —
                // and `ariaLabel` previously landed on the unfocusable div.
                aria-label={props.ariaLabel ?? props.placeholder}
                aria-activedescendant={activeOptionId.value}
                onInput={onSearchInput}
                onKeydown={onKeydown}
              />
            )}
          </div>

          <div class="vselect-indicators">
            {props.loading ? (
              slots.loader ? (
                slots.loader({ inMenu: false })
              ) : (
                <span class="vselect-spinner" aria-hidden="true" />
              )
            ) : props.clearable && hasSelection.value && !props.disabled ? (
              slots.clearicon ? (
                slots.clearicon({ clear })
              ) : (
                <button
                  type="button"
                  class="vselect-indicator"
                  aria-label="Clear selection"
                  // tabindex 0, and onClick alongside onMousedown. This was
                  // tabindex={-1} with a mousedown-only handler, so it was
                  // both unreachable by Tab and inert to keyboard activation —
                  // the browser delivers Enter/Space on a button as `click`,
                  // not `mousedown`. In single mode there was then no keyboard
                  // path to clear a value at all, since Backspace-to-deselect
                  // returns early when not multi.
                  tabindex={0}
                  onMousedown={onClearClick}
                  onClick={onClearActivate}
                >
                  <CloseIcon />
                </button>
              )
            ) : null}
            {slots.dropdownicon ? (
              slots.dropdownicon({ open: isOpen.value })
            ) : (
              <span class="vselect-indicator" aria-hidden="true">
                <ChevronDownIcon class="vselect-chevron" />
              </span>
            )}
          </div>

          {slots.suffix?.()}

          {/*
            Inputs for native form submission.

            The `required` one is deliberately NOT `type="hidden"`: hidden
            inputs are "barred from constraint validation" per the HTML
            standard, so `willValidate` is false and the constraint is ignored
            entirely — a `<VSelect name required>` with no selection submitted
            cleanly, with no validation bubble and no `:invalid`, while
            `aria-required` told screen-reader users the field was required.
            A visually-hidden text input still participates in validation.

            It is kept out of the tab order and hidden from AT: the combobox
            above already carries `aria-required`, so exposing this would
            double-announce.
          */}
          {hiddenInputs.value.map((input, i) =>
            input.required ? (
              <input
                key={i}
                class="vselect-validation-input"
                type="text"
                name={input.name}
                value={input.value}
                required
                tabindex={-1}
                aria-hidden="true"
                onFocus={onValidationInputFocus}
              />
            ) : (
              <input
                key={i}
                class="vselect-hidden-input"
                type="hidden"
                name={input.name}
                value={input.value}
              />
            ),
          )}
        </div>

        {isOpen.value &&
          (teleportTarget.value ? (
            <Teleport to={teleportTarget.value}>{renderMenu()}</Teleport>
          ) : (
            renderMenu()
          ))}
      </div>
    )
  },
})
