<script lang="ts" generics="T">
  import type { NormalizedTreeNode } from '@/svelte'
  import { checkStateOf } from '../shared/tree-helpers'
  import Self from './TreeNode.svelte'

  type Props = {
    node: NormalizedTreeNode<T>
    selected: ReadonlySet<unknown>
    expanded: ReadonlySet<string>
    onToggle: (node: NormalizedTreeNode<T>) => void
    onToggleExpand: (id: string) => void
  }

  let { node, selected, expanded, onToggle, onToggleExpand }: Props = $props()

  const state = $derived(checkStateOf(node, selected))
  const isOpen = $derived(expanded.has(node.id))

  // Bind into the input so we can set `indeterminate` (a runtime-only
  // property, can't be set via attribute).
  let inputEl: HTMLInputElement | undefined = $state()
  $effect(() => {
    if (inputEl) inputEl.indeterminate = state === 'indeterminate'
  })
</script>

<div
  class="vselect-tree-branch"
  role="treeitem"
  aria-selected={state === 'checked'}
  aria-expanded={!node.isLeaf ? isOpen : undefined}
>
  <div
    class={['vselect-tree-row', node.disabled ? 'is-disabled' : ''].filter(Boolean).join(' ')}
    style:padding-left="{8 + node.depth * 18}px"
  >
    <button
      type="button"
      class={['vselect-tree-expander', node.isLeaf ? 'is-leaf' : '', isOpen ? 'is-open' : '']
        .filter(Boolean)
        .join(' ')}
      aria-label={isOpen ? 'Collapse' : 'Expand'}
      onclick={() => !node.isLeaf && onToggleExpand(node.id)}
    >
      {#if !node.isLeaf}{isOpen ? '▾' : '▸'}{/if}
    </button>
    <input
      bind:this={inputEl}
      type="checkbox"
      class="vselect-tree-checkbox"
      checked={state === 'checked'}
      disabled={node.disabled}
      onchange={() => onToggle(node)}
    />
    <span
      class="vselect-tree-label"
      role="presentation"
      onclick={() => !node.disabled && onToggle(node)}
      onkeydown={(e) => {
        if (!node.disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onToggle(node)
        }
      }}
    >
      {node.label}
    </span>
  </div>
  {#if !node.isLeaf && isOpen && node.children.length > 0}
    <div class="vselect-tree-children" role="group">
      {#each node.children as child (child.id)}
        <Self node={child} {selected} {expanded} {onToggle} {onToggleExpand} />
      {/each}
    </div>
  {/if}
</div>
