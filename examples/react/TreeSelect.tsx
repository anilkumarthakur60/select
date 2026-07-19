import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { flattenTree, type NormalizedTreeNode, type TreeOptionLike } from '@anil-labs/select-react'
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
): ReactNode {
  const {
    options,
    modelValue,
    onChange,
    optionChildren = 'children',
    placeholder = 'Select…',
    searchable = true,
    clearable = true,
    disabled = false,
    emptyText = 'No matches',
    size = 'md',
    theme = 'light',
    maxVisibleTags,
  } = props

  const tree = useMemo(() => buildTree(options, optionChildren), [options, optionChildren])
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(allParentIds(tree)))

  const filtered = useMemo(() => searchTree(tree, query), [tree, query])
  const selectedSet = useMemo(() => new Set(modelValue), [modelValue])

  // Flat lookup for tag labels — selected leaves render as tags in the control.
  const labelByValue = useMemo(() => {
    const m = new Map<unknown, string>()
    for (const n of flattenTree(tree)) if (n.isLeaf) m.set(n.value, n.label)
    return m
  }, [tree])

  const selectedTags = useMemo(
    () => modelValue.map((v) => ({ value: v, label: labelByValue.get(v) ?? String(v) })),
    [modelValue, labelByValue],
  )
  const hasSelection = selectedTags.length > 0
  const visibleTags = maxVisibleTags ? selectedTags.slice(0, maxVisibleTags) : selectedTags
  const overflowCount = maxVisibleTags ? Math.max(0, selectedTags.length - maxVisibleTags) : 0

  const rootRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    function onDown(event: MouseEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (rootRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && searchable) searchRef.current?.focus()
  }, [isOpen, searchable])

  function open() {
    if (disabled || isOpen) return
    setIsOpen(true)
  }
  function toggleOpen() {
    if (disabled) return
    setIsOpen((v) => !v)
  }
  function toggle(node: NormalizedTreeNode<T>) {
    if (node.disabled) return
    onChange(toggleNode(node, modelValue))
  }
  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const rootClasses = [
    'vselect',
    `vselect--${size}`,
    theme === 'dark' && 'vselect--dark',
    theme === 'auto' && 'vselect--auto',
    isOpen && 'is-open',
    disabled && 'is-disabled',
    'is-multi',
    searchable && 'is-searchable',
    hasSelection && 'has-value',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={rootRef} className={rootClasses} data-disabled={disabled ? '' : undefined}>
      <div
        className="vselect-control"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="tree"
        aria-disabled={disabled || undefined}
        tabIndex={searchable ? -1 : disabled ? -1 : 0}
        onMouseDown={(e) => {
          // Don't steal focus from the search input or tag remove buttons.
          const tgt = e.target as HTMLElement
          if (tgt.closest('.vselect-search') || tgt.closest('.vselect-tag-remove')) return
          e.preventDefault()
          toggleOpen()
        }}
      >
        <div className="vselect-values">
          {visibleTags.map((tag) => (
            <span key={String(tag.value)} className="vselect-tag">
              <span className="vselect-tag-label">{tag.label}</span>
              <button
                type="button"
                className="vselect-tag-remove"
                aria-label={`Remove ${tag.label}`}
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onChange(modelValue.filter((v) => v !== tag.value))
                }}
              >
                ×
              </button>
            </span>
          ))}
          {overflowCount > 0 && <span className="vselect-tag">+{overflowCount} more</span>}
          {searchable && (
            <input
              ref={searchRef}
              type="text"
              className="vselect-search"
              autoComplete="off"
              spellCheck={false}
              value={query}
              placeholder={hasSelection ? '' : placeholder}
              disabled={disabled}
              onChange={(e) => {
                setQuery(e.target.value)
                if (!isOpen) open()
              }}
              onFocus={open}
            />
          )}
        </div>
        <div className="vselect-indicators">
          {clearable && hasSelection && !disabled && (
            <button
              type="button"
              className="vselect-indicator"
              aria-label="Clear selection"
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onChange([])
              }}
            >
              ×
            </button>
          )}
          <span className="vselect-indicator" aria-hidden="true">
            ▾
          </span>
        </div>
      </div>

      <div className="vselect-menu" role="tree" hidden={!isOpen}>
        {filtered.length === 0 ? (
          <div className="vselect-tree-empty">{emptyText}</div>
        ) : (
          filtered.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              selected={selectedSet}
              expanded={expanded}
              onToggle={toggle}
              onToggleExpand={toggleExpand}
            />
          ))
        )}
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
}): ReactNode {
  const { node, selected, expanded, onToggle, onToggleExpand } = props
  const state = checkStateOf(node, selected)
  const isOpen = expanded.has(node.id)
  return (
    <div
      className="vselect-tree-branch"
      role="treeitem"
      aria-selected={state === 'checked'}
      aria-expanded={!node.isLeaf ? isOpen : undefined}
    >
      <div
        className={`vselect-tree-row${node.disabled ? ' is-disabled' : ''}`}
        style={{ paddingLeft: 8 + node.depth * 18 }}
      >
        <button
          type="button"
          className={`vselect-tree-expander${node.isLeaf ? ' is-leaf' : ''}${
            isOpen ? ' is-open' : ''
          }`}
          aria-label={isOpen ? 'Collapse' : 'Expand'}
          onMouseDown={(e) => {
            e.preventDefault()
            if (!node.isLeaf) onToggleExpand(node.id)
          }}
        >
          {!node.isLeaf && (isOpen ? '▾' : '▸')}
        </button>
        <input
          type="checkbox"
          className="vselect-tree-checkbox"
          checked={state === 'checked'}
          ref={(el) => {
            if (el) el.indeterminate = state === 'indeterminate'
          }}
          disabled={node.disabled}
          onChange={() => onToggle(node)}
        />
        <span
          className="vselect-tree-label"
          onMouseDown={(e) => {
            e.preventDefault()
            if (!node.disabled) onToggle(node)
          }}
        >
          {node.label}
        </span>
      </div>
      {!node.isLeaf && isOpen && node.children.length > 0 && (
        <div className="vselect-tree-children" role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selected={selected}
              expanded={expanded}
              onToggle={onToggle}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}
