import { createEffect, createMemo, createSignal, For, onCleanup, Show, type JSX } from 'solid-js'
import { flattenTree, type NormalizedTreeNode, type TreeOptionLike } from '@/solid'
import {
  allParentIds,
  buildTree,
  checkStateOf,
  searchTree,
  toggleNode,
} from '../shared/tree-helpers'

export interface TreeSelectProps<T extends TreeOptionLike = TreeOptionLike> {
  options: readonly T[]
  modelValue: readonly unknown[]
  onChange: (next: unknown[]) => void
  optionChildren?: string
  placeholder?: string
  searchable?: boolean
  clearable?: boolean
  disabled?: boolean
  emptyText?: string
  size?: 'sm' | 'md' | 'lg'
  theme?: 'light' | 'dark' | 'auto'
  maxVisibleTags?: number
}

export default function TreeSelect<T extends TreeOptionLike = TreeOptionLike>(
  props: TreeSelectProps<T>,
): JSX.Element {
  const tree = createMemo(() => buildTree(props.options, props.optionChildren ?? 'children'))
  const [query, setQuery] = createSignal('')
  const [isOpen, setIsOpen] = createSignal(false)
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set(allParentIds(tree())))

  const filtered = createMemo(() => searchTree(tree(), query()))
  const selectedSet = createMemo(() => new Set(props.modelValue))

  const labelByValue = createMemo(() => {
    const m = new Map<unknown, string>()
    for (const n of flattenTree(tree())) if (n.isLeaf) m.set(n.value, n.label)
    return m
  })

  const selectedTags = createMemo(() =>
    props.modelValue.map((v) => ({ value: v, label: labelByValue().get(v) ?? String(v) })),
  )
  const hasSelection = createMemo(() => selectedTags().length > 0)
  const visibleTags = createMemo(() =>
    props.maxVisibleTags ? selectedTags().slice(0, props.maxVisibleTags) : selectedTags(),
  )
  const overflowCount = createMemo(() =>
    props.maxVisibleTags ? Math.max(0, selectedTags().length - props.maxVisibleTags) : 0,
  )

  let rootEl: HTMLDivElement | undefined
  let searchEl: HTMLInputElement | undefined
  const setRoot = (el: HTMLDivElement) => (rootEl = el)
  const setSearch = (el: HTMLInputElement) => (searchEl = el)

  createEffect(() => {
    if (!isOpen()) return
    function onDown(event: MouseEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (rootEl?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    onCleanup(() => document.removeEventListener('mousedown', onDown))
  })

  createEffect(() => {
    if (isOpen() && props.searchable !== false) queueMicrotask(() => searchEl?.focus())
  })

  function open() {
    if (props.disabled || isOpen()) return
    setIsOpen(true)
  }
  function toggleOpen() {
    if (props.disabled) return
    setIsOpen((v) => !v)
  }
  function toggle(node: NormalizedTreeNode<T>) {
    if (node.disabled) return
    props.onChange(toggleNode(node, props.modelValue))
  }
  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const rootClass = createMemo(() =>
    [
      'vselect',
      `vselect--${props.size ?? 'md'}`,
      props.theme === 'dark' && 'vselect--dark',
      props.theme === 'auto' && 'vselect--auto',
      isOpen() && 'is-open',
      props.disabled && 'is-disabled',
      'is-multi',
      props.searchable !== false && 'is-searchable',
      hasSelection() && 'has-value',
    ]
      .filter(Boolean)
      .join(' '),
  )

  return (
    <div ref={setRoot} class={rootClass()} data-disabled={props.disabled ? '' : undefined}>
      <div
        class="vselect-control"
        role="combobox"
        aria-expanded={isOpen()}
        aria-haspopup="tree"
        aria-disabled={props.disabled || undefined}
        tabindex={props.searchable !== false ? -1 : props.disabled ? -1 : 0}
        onmousedown={(e) => {
          const tgt = e.target as HTMLElement
          if (tgt.closest('.vselect-search') || tgt.closest('.vselect-tag-remove')) return
          e.preventDefault()
          toggleOpen()
        }}
      >
        <div class="vselect-values">
          <For each={visibleTags()}>
            {(tag) => (
              <span class="vselect-tag">
                <span class="vselect-tag-label">{tag.label}</span>
                <button
                  type="button"
                  class="vselect-tag-remove"
                  aria-label={`Remove ${tag.label}`}
                  tabindex={-1}
                  onmousedown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    props.onChange(props.modelValue.filter((v) => v !== tag.value))
                  }}
                >
                  ×
                </button>
              </span>
            )}
          </For>
          <Show when={overflowCount() > 0}>
            <span class="vselect-tag">+{overflowCount()} more</span>
          </Show>
          <Show when={props.searchable !== false}>
            <input
              ref={setSearch}
              type="text"
              class="vselect-search"
              autocomplete="off"
              spellcheck={false}
              value={query()}
              placeholder={hasSelection() ? '' : props.placeholder ?? 'Select…'}
              disabled={props.disabled}
              onInput={(e) => {
                setQuery(e.currentTarget.value)
                if (!isOpen()) open()
              }}
              onFocus={open}
            />
          </Show>
        </div>
        <div class="vselect-indicators">
          <Show when={props.clearable !== false && hasSelection() && !props.disabled}>
            <button
              type="button"
              class="vselect-indicator"
              aria-label="Clear selection"
              tabindex={-1}
              onmousedown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                props.onChange([])
              }}
            >
              ×
            </button>
          </Show>
          <span class="vselect-indicator" aria-hidden="true">
            ▾
          </span>
        </div>
      </div>

      <div class="vselect-menu" role="tree" hidden={!isOpen()}>
        <Show
          when={filtered().length > 0}
          fallback={<div class="vselect-tree-empty">{props.emptyText ?? 'No matches'}</div>}
        >
          <For each={filtered()}>
            {(node) => (
              <TreeNode
                node={node}
                selected={selectedSet()}
                expanded={expanded()}
                onToggle={toggle}
                onToggleExpand={toggleExpand}
              />
            )}
          </For>
        </Show>
      </div>
    </div>
  )
}

function TreeNode<T>(props: {
  node: NormalizedTreeNode<T>
  selected: ReadonlySet<unknown>
  expanded: ReadonlySet<string>
  onToggle: (node: NormalizedTreeNode<T>) => void
  onToggleExpand: (id: string) => void
}): JSX.Element {
  const state = createMemo(() => checkStateOf(props.node, props.selected))
  const isOpen = createMemo(() => props.expanded.has(props.node.id))
  let inputEl: HTMLInputElement | undefined
  const setInput = (el: HTMLInputElement) => {
    inputEl = el
    el.indeterminate = state() === 'indeterminate'
  }
  createEffect(() => {
    if (inputEl) inputEl.indeterminate = state() === 'indeterminate'
  })

  return (
    <div
      class="vselect-tree-branch"
      role="treeitem"
      aria-selected={state() === 'checked'}
      aria-expanded={!props.node.isLeaf ? isOpen() : undefined}
    >
      <div
        class={`vselect-tree-row${props.node.disabled ? ' is-disabled' : ''}`}
        style={{ 'padding-left': `${8 + props.node.depth * 18}px` }}
      >
        <button
          type="button"
          class={`vselect-tree-expander${props.node.isLeaf ? ' is-leaf' : ''}${
            isOpen() ? ' is-open' : ''
          }`}
          aria-label={isOpen() ? 'Collapse' : 'Expand'}
          onmousedown={(e) => {
            e.preventDefault()
            if (!props.node.isLeaf) props.onToggleExpand(props.node.id)
          }}
        >
          {!props.node.isLeaf && (isOpen() ? '▾' : '▸')}
        </button>
        <input
          ref={setInput}
          type="checkbox"
          class="vselect-tree-checkbox"
          checked={state() === 'checked'}
          disabled={props.node.disabled}
          onchange={() => props.onToggle(props.node)}
        />
        <span
          class="vselect-tree-label"
          onmousedown={(e) => {
            e.preventDefault()
            if (!props.node.disabled) props.onToggle(props.node)
          }}
        >
          {props.node.label}
        </span>
      </div>
      <Show when={!props.node.isLeaf && isOpen() && props.node.children.length > 0}>
        <div class="vselect-tree-children" role="group">
          <For each={props.node.children}>
            {(child) => (
              <TreeNode
                node={child}
                selected={props.selected}
                expanded={props.expanded}
                onToggle={props.onToggle}
                onToggleExpand={props.onToggleExpand}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
