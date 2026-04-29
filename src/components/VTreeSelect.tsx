import {
  computed,
  defineComponent,
  nextTick,
  reactive,
  ref,
  Teleport,
  watch,
  withModifiers,
  type PropType,
  type SlotsType,
} from 'vue'
import type { OptionAccessor, SelectSize, SelectTheme } from '@/types/option'
import type { NormalizedTreeNode, TreeOptionLike } from '@/types/tree-node'
import type { VTreeSelectSlots } from '@/types'
import { filterTree, flattenTree, getAncestorIds, normalizeTree, walkTree } from '@/core/tree'
import { useControlFocus } from '@/composables/useControlFocus'
import { useDebounced } from '@/composables/useDebounced'
import { useFloatingMenu } from '@/composables/useFloatingMenu'
import { useFormBinding } from '@/composables/useFormBinding'
import { useOutsideClick } from '@/composables/useOutsideClick'
import { useStableId } from '@/composables/useStableId'
import { useTreeSelection } from '@/composables/useTreeSelection'
import { useTriggerInteractions } from '@/composables/useTriggerInteractions'
import { ChevronDownIcon, CloseIcon } from '@/components/icons'
import VTreeSelectNode from '@/components/VTreeSelectNode'

export default defineComponent({
  name: 'VTreeSelect',
  inheritAttrs: false,
  props: {
    modelValue: { type: Array as PropType<unknown[]>, default: () => [] },
    options: { type: Array as PropType<TreeOptionLike[]>, default: () => [] },
    // Loosened from `keyof T | (...)` for the same reason as VSelect — TSX
    // can't keep the SFC's `<T extends TreeOptionLike>` generic, so the
    // runtime prop accepts any string or accessor; the public
    // `VTreeSelectProps<T>` type still narrows.
    optionValue: {
      type: [String, Function] as PropType<string | ((option: TreeOptionLike) => unknown)>,
    },
    optionLabel: {
      type: [String, Function] as PropType<string | ((option: TreeOptionLike) => string)>,
    },
    optionChildren: {
      type: [String, Function] as PropType<
        string | ((option: TreeOptionLike) => TreeOptionLike[] | undefined)
      >,
    },
    optionDisabled: {
      type: [String, Function] as PropType<string | ((option: TreeOptionLike) => boolean)>,
    },
    placeholder: { type: String, default: 'Select…' },
    searchable: { type: Boolean, default: true },
    clearable: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    maxSelections: { type: Number },
    maxVisibleTags: { type: Number },
    defaultExpandAll: { type: Boolean, default: false },
    showToolbar: { type: Boolean, default: true },
    closeOnSelect: { type: Boolean, default: false },
    autofocus: { type: Boolean, default: false },
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
    'update:modelValue': (_value: unknown[]) => true,
    'update:search': (_value: string) => true,
    open: () => true,
    close: () => true,
    focus: (_event: FocusEvent) => true,
    blur: (_event: FocusEvent) => true,
    select: (_node: NormalizedTreeNode<unknown>) => true,
    deselect: (_node: NormalizedTreeNode<unknown>) => true,
    expand: (_node: NormalizedTreeNode<unknown>) => true,
    collapse: (_node: NormalizedTreeNode<unknown>) => true,
    search: (_query: string) => true,
  },
  slots: Object as SlotsType<VTreeSelectSlots<TreeOptionLike>>,
  setup(props, { emit, attrs, slots, expose }) {
    const fallbackId = useStableId('vtreeselect')
    const baseId = computed(() => props.id ?? fallbackId)
    const treeId = computed(() => `${baseId.value}-tree`)

    const rootEl = ref<HTMLElement | null>(null)
    const controlEl = ref<HTMLElement | null>(null)
    const menuEl = ref<HTMLElement | null>(null)
    const searchEl = ref<HTMLInputElement | null>(null)

    const isOpen = ref(false)

    // `query` is the live input value (synced to the DOM input every keystroke);
    // `effectiveQuery` is debounced and drives filterTree + the search emits.
    const query = ref('')
    const debounceMs = computed(() => props.debounce)
    const {
      debounced: effectiveQuery,
      flush: flushSearch,
      force: forceSearch,
    } = useDebounced(query, debounceMs)

    // `reactive(new Set(...))` makes Vue track reads/writes — `watch(... { deep })`
    // in the node component picks up id-level mutations without us emitting.
    const expanded = reactive(new Set<string>())

    type T = TreeOptionLike

    const tree = computed<NormalizedTreeNode<T>[]>(() =>
      normalizeTree(props.options as T[], {
        optionValue: props.optionValue as OptionAccessor<T, unknown> | undefined,
        optionLabel: props.optionLabel as OptionAccessor<T, string> | undefined,
        optionChildren: props.optionChildren as OptionAccessor<T, T[] | undefined> | undefined,
        optionDisabled: props.optionDisabled as OptionAccessor<T, boolean> | undefined,
      }),
    )

    // Re-seed the expansion set when the tree shape (re)builds. We deliberately
    // don't preserve old ids — they become invalid the moment the underlying
    // option array changes identity.
    watch(
      tree,
      (next) => {
        expanded.clear()
        if (props.defaultExpandAll) {
          walkTree(next, (n) => {
            if (!n.isLeaf) expanded.add(n.id)
          })
        }
      },
      { immediate: true },
    )

    const filteredTree = computed(() => {
      if (!effectiveQuery.value) return tree.value
      return filterTree(tree.value, effectiveQuery.value)
    })

    // While searching, expand every parent in the filtered subtree so matches
    // are visible without an extra click. Restored on query clear by the watcher
    // above re-seeding from `defaultExpandAll`.
    watch(filteredTree, (next, prev) => {
      if (!effectiveQuery.value) return
      if (next === prev) return
      walkTree(next, (n) => {
        if (!n.isLeaf) expanded.add(n.id)
      })
    })

    watch(effectiveQuery, (q) => {
      emit('search', q)
      emit('update:search', q)
    })

    const modelRef = computed(() => props.modelValue)
    const maxSelectionsRef = computed(() => props.maxSelections)

    const { selectedValues, getCheckState, toggle, selectAll, clear } = useTreeSelection<T>({
      modelValue: modelRef,
      tree,
      maxSelections: maxSelectionsRef,
      emitUpdate: (v) => emit('update:modelValue', v),
      emitSelect: (n) => emit('select', n),
      emitDeselect: (n) => emit('deselect', n),
    })

    // Lookup of every leaf node in the current tree, by value. Lets us render
    // labels in the trigger area without re-walking the tree on every paint.
    const leafByValue = computed(() => {
      const map = new Map<unknown, NormalizedTreeNode<T>>()
      walkTree(tree.value, (n) => {
        if (n.isLeaf) map.set(n.value, n)
      })
      return map
    })

    // Every node in the tree, keyed by id. Drives ancestor lookups when we
    // auto-expand parent paths to selected leaves on open.
    const nodeById = computed(() => {
      const map = new Map<string, NormalizedTreeNode<T>>()
      walkTree(tree.value, (n) => {
        map.set(n.id, n)
      })
      return map
    })

    const selectedLeaves = computed(() =>
      selectedValues.value
        .map((v) => leafByValue.value.get(v))
        .filter((n): n is NormalizedTreeNode<T> => n !== undefined),
    )

    const visibleTags = computed(() => {
      if (props.maxVisibleTags === undefined) return selectedLeaves.value
      return selectedLeaves.value.slice(0, props.maxVisibleTags)
    })

    const overflowTagCount = computed(() => {
      if (props.maxVisibleTags === undefined) return 0
      return Math.max(selectedLeaves.value.length - props.maxVisibleTags, 0)
    })

    const hasSelection = computed(() => selectedValues.value.length > 0)

    const flattened = computed(() => flattenTree(filteredTree.value))
    const isEmpty = computed(() => flattened.value.length === 0)

    const emptyMessage = computed(() => {
      if (query.value) return props.noResultsText ?? props.emptyText
      return props.emptyText
    })

    function open() {
      if (props.disabled || isOpen.value) return
      isOpen.value = true
      emit('open')
      // Reveal parents of every selected leaf so the user lands on the menu
      // already showing what's checked, instead of an apparently-empty tree.
      for (const leaf of selectedLeaves.value) {
        for (const id of getAncestorIds(leaf, nodeById.value)) {
          expanded.add(id)
        }
      }
      nextTick(() => {
        if (props.searchable && searchEl.value) searchEl.value.focus()
        if (isFloating.value) updateFloating()
      })
    }

    function close() {
      if (!isOpen.value) return
      isOpen.value = false
      emit('close')
    }

    function toggleOpen() {
      if (isOpen.value) close()
      else open()
    }

    function onToggle(node: NormalizedTreeNode<T>) {
      toggle(node)
      if (props.closeOnSelect) close()
    }

    function onExpand(node: NormalizedTreeNode<T>) {
      expanded.add(node.id)
      emit('expand', node)
    }

    function onCollapse(node: NormalizedTreeNode<T>) {
      expanded.delete(node.id)
      emit('collapse', node)
    }

    function expandAll() {
      walkTree(tree.value, (n) => {
        if (!n.isLeaf) expanded.add(n.id)
      })
    }

    function collapseAll() {
      expanded.clear()
    }

    // True when every non-leaf node in the *full* tree (not the filtered
    // subset) is expanded. Driven from `tree` rather than `filteredTree` so
    // the toolbar's toggle reflects the canonical state, not a search artefact.
    const allExpanded = computed(() => {
      let allOpen = true
      let hasParents = false
      walkTree(tree.value, (n) => {
        if (n.isLeaf) return
        hasParents = true
        if (!expanded.has(n.id)) {
          allOpen = false
          return false
        }
      })
      return hasParents && allOpen
    })

    const hasParents = computed(() => {
      let found = false
      walkTree(tree.value, (n) => {
        if (!n.isLeaf) {
          found = true
          return false
        }
      })
      return found
    })

    function onClearClick(event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()
      clear()
      query.value = ''
      forceSearch('')
    }

    function onTagRemove(node: NormalizedTreeNode<T>) {
      toggle(node)
    }

    const { onControlMousedown, onSearchInput } = useTriggerInteractions({
      disabled: computed(() => props.disabled),
      searchable: computed(() => props.searchable),
      isOpen,
      searchEl,
      query,
      open,
      toggle: toggleOpen,
      // The clear button stops propagation in `onClearClick`, so we don't need
      // to ignore `.vselect-indicator` here — and ignoring it would also swallow
      // chevron clicks, leaving users with no way to toggle the menu by icon.
      ignoreSelectors: ['.vselect-tag-remove'],
    })

    const teleportToRef = computed(() => props.teleportTo)
    const {
      styles: floatingStyles,
      target: teleportTarget,
      floating: isFloating,
      update: updateFloating,
    } = useFloatingMenu(controlEl, menuEl, { teleportTo: teleportToRef })

    useOutsideClick({ active: isOpen, contains: [rootEl, menuEl], onOutside: close })

    const { focused, onFocusIn, onFocusOut } = useControlFocus({
      root: rootEl,
      onFocus: (event) => emit('focus', event),
      onBlur: (event) => emit('blur', event),
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
        'is-multi': true,
        'is-searchable': props.searchable,
        'is-loading': props.loading,
        'has-value': hasSelection.value,
      },
    ])

    const isMultiRef = computed(() => true)
    const { hiddenInputs } = useFormBinding({
      name: computed(() => props.name),
      required: computed(() => props.required),
      values: selectedValues,
      isMulti: isMultiRef,
    })

    watch(
      () => props.autofocus,
      (auto) => {
        if (auto) nextTick(() => searchEl.value?.focus() ?? controlEl.value?.focus())
      },
      { immediate: true },
    )

    expose({
      open,
      close,
      toggle: toggleOpen,
      focus: () => (searchEl.value ?? controlEl.value)?.focus(),
      blur: () => (searchEl.value ?? controlEl.value)?.blur(),
      clear,
      selectAll,
      expand: (id: string) => {
        expanded.add(id)
      },
      collapse: (id: string) => {
        expanded.delete(id)
      },
      expandAll,
      collapseAll,
      flushSearch,
      get isOpen() {
        return isOpen.value
      },
    })

    const renderMenu = () => (
      <div
        v-show={isOpen.value}
        id={treeId.value}
        ref={(el) => {
          menuEl.value = el as HTMLElement | null
        }}
        class={[
          'vselect-menu',
          'vselect-tree',
          `vselect--${props.size}`,
          props.theme === 'dark' && 'vselect--dark',
          props.theme === 'auto' && 'vselect--auto',
        ]}
        role="tree"
        aria-multiselectable={true}
        style={floatingStyles.value}
      >
        {props.loading ? (
          <div class="vselect-loading">
            <span class="vselect-spinner" />
            <span>{props.loadingText}</span>
          </div>
        ) : (
          <>
            {props.showToolbar &&
              !isEmpty.value &&
              (slots.toolbar ? (
                slots.toolbar({
                  selectAll,
                  clear,
                  expandAll,
                  collapseAll,
                  allExpanded: allExpanded.value,
                  selectedCount: selectedValues.value.length,
                })
              ) : (
                <div class="vselect-tree-toolbar">
                  <span>{selectedValues.value.length} selected</span>
                  <span>
                    {hasParents.value && (
                      <button
                        type="button"
                        class="vselect-tree-toolbar-action"
                        tabindex={-1}
                        onMousedown={withModifiers(
                          () => (allExpanded.value ? collapseAll() : expandAll()),
                          ['prevent'],
                        )}
                      >
                        {allExpanded.value ? 'Collapse all' : 'Expand all'}
                      </button>
                    )}
                    <button
                      type="button"
                      class="vselect-tree-toolbar-action"
                      tabindex={-1}
                      onMousedown={withModifiers(() => selectAll(), ['prevent'])}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      class="vselect-tree-toolbar-action"
                      tabindex={-1}
                      disabled={!hasSelection.value}
                      onMousedown={withModifiers(() => clear(), ['prevent'])}
                    >
                      Clear
                    </button>
                  </span>
                </div>
              ))}

            {isEmpty.value ? (
              slots.empty ? (
                slots.empty({
                  query: query.value,
                  mode: query.value ? 'no-results' : 'no-options',
                })
              ) : (
                <div class="vselect-tree-empty">{emptyMessage.value}</div>
              )
            ) : (
              filteredTree.value.map((node) => (
                <VTreeSelectNode
                  key={node.id}
                  node={node}
                  expanded={expanded}
                  getCheckState={getCheckState}
                  idPrefix={baseId.value}
                  onToggle={onToggle}
                  onExpand={onExpand}
                  onCollapse={onCollapse}
                />
              ))
            )}
          </>
        )}
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
          aria-controls={treeId.value}
          aria-haspopup="tree"
          aria-disabled={props.disabled || undefined}
          aria-label={props.ariaLabel ?? props.placeholder}
          tabindex={props.searchable ? -1 : props.disabled ? -1 : 0}
          {...attrs}
          onMousedown={onControlMousedown}
        >
          {slots.prefix?.()}

          <div class="vselect-values">
            {slots.value && hasSelection.value && !query.value ? (
              slots.value({ selected: selectedLeaves.value })
            ) : hasSelection.value && !query.value ? (
              <>
                {visibleTags.value.map((node) =>
                  slots.tag ? (
                    <span key={node.id}>
                      {slots.tag({
                        node,
                        remove: () => onTagRemove(node),
                        disabled: props.disabled,
                      })}
                    </span>
                  ) : (
                    <span key={node.id} class="vselect-tag">
                      <span class="vselect-tag-label">{node.label}</span>
                      {!props.disabled && (
                        <button
                          type="button"
                          class="vselect-tag-remove"
                          aria-label={`Remove ${node.label}`}
                          tabindex={-1}
                          onMousedown={withModifiers(() => onTagRemove(node), ['prevent', 'stop'])}
                        >
                          <CloseIcon />
                        </button>
                      )}
                    </span>
                  ),
                )}
                {overflowTagCount.value > 0 && (
                  <span class="vselect-tag vselect-tag--overflow">+{overflowTagCount.value}</span>
                )}
              </>
            ) : null}

            {!hasSelection.value && !query.value && !props.searchable && (
              <span class="vselect-placeholder">{props.placeholder}</span>
            )}

            {props.searchable && (
              <input
                ref={(el) => {
                  searchEl.value = el as HTMLInputElement | null
                }}
                class="vselect-search"
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck={false}
                value={query.value}
                placeholder={hasSelection.value ? undefined : props.placeholder}
                disabled={props.disabled}
                aria-controls={treeId.value}
                aria-autocomplete="list"
                onInput={onSearchInput}
              />
            )}
          </div>

          <div class="vselect-indicators">
            {props.clearable && hasSelection.value && !props.disabled ? (
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
