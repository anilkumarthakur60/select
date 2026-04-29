import {
  computed,
  defineComponent,
  nextTick,
  ref,
  Teleport,
  watch,
  withModifiers,
  type PropType,
  type SlotsType,
} from 'vue'
import type { FilterFn } from '@/types/filter'
import type {
  NormalizedOption,
  OptionLike,
  SelectMode,
  SelectSize,
  SelectTheme,
} from '@/types/option'
import type { OptionSlotProps, VSelectProps, VSelectSlots } from '@/types'
import { normalize } from '@/core/normalize'
import { useControlFocus } from '@/composables/useControlFocus'
import { useDebounced } from '@/composables/useDebounced'
import { useFloatingMenu } from '@/composables/useFloatingMenu'
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
    // `keyof T` narrowing. Consumers who want narrowing should reach for the
    // public `VSelectProps<T>` type directly.
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
    closeOnSelect: { type: Boolean },
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
        emitSelect: (o) => emit('select', o as NormalizedOption<T>),
        emitDeselect: (o) => emit('deselect', o as NormalizedOption<T>),
      })

    const { filtered } = useOptionFilter<T>({
      options: normalizedOptions,
      query: effectiveQuery,
      filter: props.filter,
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
      const idx = activeIndex.value
      const option = filtered.value[idx]
      if (!option) return
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
      const el = menuEl.value.querySelector<HTMLElement>(`[id="${baseId.value}-opt-${opt.id}"]`)
      // jsdom (test env) and some older browsers don't implement scrollIntoView.
      el?.scrollIntoView?.({ block: 'nearest' })
    }

    watch(isOpen, (openVal) => {
      if (openVal) {
        emit('open')
        nextTick(() => {
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
      nextTick(scrollActiveIntoView)
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
      focus: () => searchEl.value?.focus() ?? controlEl.value?.focus(),
      blur: () => searchEl.value?.blur() ?? controlEl.value?.blur(),
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
        if (auto) nextTick(() => searchEl.value?.focus() ?? controlEl.value?.focus())
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
          role="combobox"
          aria-expanded={isOpen.value}
          aria-controls={listboxId.value}
          aria-haspopup="listbox"
          aria-disabled={props.disabled || undefined}
          aria-required={props.required || undefined}
          aria-label={props.ariaLabel ?? props.placeholder}
          aria-activedescendant={activeOptionId.value}
          tabindex={props.searchable ? -1 : props.disabled ? -1 : 0}
          {...attrs}
          onMousedown={onControlMousedown}
          onKeydown={(e: KeyboardEvent) => {
            if (!props.searchable) onKeydown(e)
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
                aria-controls={listboxId.value}
                aria-autocomplete="list"
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
                  tabindex={-1}
                  onMousedown={onClearClick}
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

          {/* Hidden inputs for native form submission. */}
          {hiddenInputs.value.map((input, i) => (
            <input
              key={i}
              class="vselect-hidden-input"
              type="hidden"
              name={input.name}
              value={input.value}
              required={input.required || undefined}
            />
          ))}
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
