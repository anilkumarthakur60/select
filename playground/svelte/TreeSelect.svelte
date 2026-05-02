<script lang="ts" generics="T extends TreeOptionLike = TreeOptionLike">
  import { flattenTree, type NormalizedTreeNode, type TreeOptionLike } from '@/svelte'
  import { allParentIds, buildTree, searchTree, toggleNode } from '../shared/tree-helpers'
  import TreeNode from './TreeNode.svelte'

  type Props = {
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

  let {
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
  }: Props = $props()

  const tree = $derived(buildTree(options, optionChildren))
  let query = $state('')
  let isOpen = $state(false)
  let expanded = $state(new Set<string>(allParentIds(buildTree(options, optionChildren))))

  const filtered = $derived(searchTree(tree, query))
  const selectedSet = $derived(new Set(modelValue))

  const labelByValue = $derived.by(() => {
    const m = new Map<unknown, string>()
    for (const n of flattenTree(tree)) if (n.isLeaf) m.set(n.value, n.label)
    return m
  })

  const selectedTags = $derived(
    modelValue.map((v) => ({ value: v, label: labelByValue.get(v) ?? String(v) })),
  )
  const hasSelection = $derived(selectedTags.length > 0)
  const visibleTags = $derived(
    maxVisibleTags ? selectedTags.slice(0, maxVisibleTags) : selectedTags,
  )
  const overflowCount = $derived(
    maxVisibleTags ? Math.max(0, selectedTags.length - maxVisibleTags) : 0,
  )

  let rootEl: HTMLDivElement | undefined = $state()
  let searchEl: HTMLInputElement | undefined = $state()

  $effect(() => {
    if (!isOpen) return
    function onDown(event: MouseEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (rootEl?.contains(target)) return
      isOpen = false
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  })

  $effect(() => {
    if (isOpen && searchable) queueMicrotask(() => searchEl?.focus())
  })

  function open() {
    if (disabled || isOpen) return
    isOpen = true
  }
  function toggleOpen() {
    if (disabled) return
    isOpen = !isOpen
  }
  function toggle(node: NormalizedTreeNode<T>) {
    if (node.disabled) return
    onChange(toggleNode(node, modelValue))
  }
  function toggleExpand(id: string) {
    if (expanded.has(id)) expanded.delete(id)
    else expanded.add(id)
    expanded = new Set(expanded)
  }

  const rootClass = $derived(
    [
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
      .join(' '),
  )
</script>

<div bind:this={rootEl} class={rootClass} data-disabled={disabled ? '' : undefined}>
  <div
    class="vselect-control"
    role="combobox"
    aria-expanded={isOpen}
    aria-haspopup="tree"
    aria-controls="vselect-tree-menu"
    aria-disabled={disabled || undefined}
    tabindex={searchable ? -1 : disabled ? -1 : 0}
    onmousedown={(e) => {
      const tgt = e.target as HTMLElement
      if (tgt.closest('.vselect-search') || tgt.closest('.vselect-tag-remove')) return
      e.preventDefault()
      toggleOpen()
    }}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggleOpen()
      }
    }}
  >
    <div class="vselect-values">
      {#each visibleTags as tag (tag.value)}
        <span class="vselect-tag">
          <span class="vselect-tag-label">{tag.label}</span>
          <button
            type="button"
            class="vselect-tag-remove"
            aria-label="Remove {tag.label}"
            tabindex={-1}
            onmousedown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onChange(modelValue.filter((v) => v !== tag.value))
            }}>×</button
          >
        </span>
      {/each}
      {#if overflowCount > 0}
        <span class="vselect-tag">+{overflowCount} more</span>
      {/if}
      {#if searchable}
        <input
          bind:this={searchEl}
          type="text"
          class="vselect-search"
          autocomplete="off"
          spellcheck={false}
          bind:value={query}
          placeholder={hasSelection ? '' : placeholder}
          {disabled}
          oninput={() => !isOpen && open()}
          onfocus={open}
        />
      {/if}
    </div>
    <div class="vselect-indicators">
      {#if clearable && hasSelection && !disabled}
        <button
          type="button"
          class="vselect-indicator"
          aria-label="Clear selection"
          tabindex={-1}
          onmousedown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onChange([])
          }}>×</button
        >
      {/if}
      <span class="vselect-indicator" aria-hidden="true">▾</span>
    </div>
  </div>

  <div class="vselect-menu" role="tree" hidden={!isOpen}>
    {#if filtered.length === 0}
      <div class="vselect-tree-empty">{emptyText}</div>
    {:else}
      {#each filtered as node (node.id)}
        <TreeNode
          {node}
          selected={selectedSet}
          {expanded}
          onToggle={toggle}
          onToggleExpand={toggleExpand}
        />
      {/each}
    {/if}
  </div>
</div>
