import { flattenTree, type NormalizedTreeNode, type TreeOptionLike } from '@anil-labs/select-core'
import { allParentIds, buildTree, checkStateOf, searchTree, toggleNode } from './tree-helpers'

// Vanilla popover-style tree-select. Same UX as the Vue/React/Svelte/Solid
// versions — control with selected tags + search input + chevron, opens a
// menu containing the checkbox tree. No framework runtime; just the
// package's pure tree helpers driving an innerHTML render with delegated
// event listeners.

type TreeTheme = 'light' | 'dark' | 'auto'

interface RenderArgs<T extends TreeOptionLike> {
  mount: HTMLElement
  out: HTMLElement
  options: readonly T[]
  initial: readonly unknown[]
  outKey: string
  optionChildren?: string
  emptyText?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  maxVisibleTags?: number
  theme?: TreeTheme
}

/** Handle returned to callers that need to drive the instance after mount. */
export interface TreeSelectHandle {
  /** Re-theme in place — mirrors the `theme` attribute on `<a-select>`. */
  setTheme(theme: TreeTheme): void
}

export function renderTreeSelect<T extends TreeOptionLike>(args: RenderArgs<T>): TreeSelectHandle {
  const { mount, out, options, initial, outKey, optionChildren = 'children' } = args
  const tree = buildTree(options, optionChildren)

  let selected: unknown[] = [...initial]
  let query = ''
  let isOpen = false
  let theme: TreeTheme = args.theme ?? 'light'
  const expanded = new Set<string>(allParentIds(tree))

  // Leaf-id → label, so the tags in the control can be looked up by value.
  const labelByValue = new Map<unknown, string>()
  for (const n of flattenTree(tree)) if (n.isLeaf) labelByValue.set(n.value, n.label)

  function emit() {
    out.textContent = JSON.stringify({ [outKey]: selected }, null, 2)
  }

  function render(): void {
    // innerHTML replacement detaches the live search element, killing focus
    // mid-typing. Capture focus + caret position now and restore at the end
    // so the user can keep typing while the tree filters underneath them.
    const liveSearch = mount.querySelector<HTMLInputElement>('input.vselect-search')
    const wasSearchFocused = liveSearch !== null && document.activeElement === liveSearch
    const caretStart = wasSearchFocused ? liveSearch.selectionStart : null
    const caretEnd = wasSearchFocused ? liveSearch.selectionEnd : null

    const filtered = searchTree(tree, query)
    const selectedSet = new Set(selected)
    const tags = selected.map((v) => ({ value: v, label: labelByValue.get(v) ?? String(v) }))
    const hasSelection = tags.length > 0
    const visible = args.maxVisibleTags ? tags.slice(0, args.maxVisibleTags) : tags
    const overflow = args.maxVisibleTags ? Math.max(0, tags.length - args.maxVisibleTags) : 0

    const rootClasses = [
      'vselect',
      `vselect--${args.size ?? 'md'}`,
      // Matches what the machine's getRootProps() emits for <a-select>: only
      // dark/auto get a class, light is the default token set.
      theme !== 'light' && `vselect--${theme}`,
      isOpen && 'is-open',
      'is-multi',
      'is-searchable',
      hasSelection && 'has-value',
    ]
      .filter(Boolean)
      .join(' ')

    mount.className = rootClasses
    mount.innerHTML = `
      <div class="vselect-control" role="combobox" aria-expanded="${isOpen}" aria-haspopup="tree" tabindex="-1" data-action="toggle-open">
        <div class="vselect-values">
          ${visible
            .map(
              (t) => `
            <span class="vselect-tag">
              <span class="vselect-tag-label">${escapeText(t.label)}</span>
              <button type="button" class="vselect-tag-remove" aria-label="Remove ${escapeAttr(
                t.label,
              )}" tabindex="-1" data-action="remove" data-value="${escapeAttr(String(t.value))}">×</button>
            </span>`,
            )
            .join('')}
          ${overflow > 0 ? `<span class="vselect-tag">+${overflow} more</span>` : ''}
          <input type="text" class="vselect-search" autocomplete="off" spellcheck="false"
            value="${escapeAttr(query)}"
            placeholder="${escapeAttr(hasSelection ? '' : (args.placeholder ?? 'Select…'))}" />
        </div>
        <div class="vselect-indicators">
          ${
            hasSelection
              ? `<button type="button" class="vselect-indicator" aria-label="Clear" tabindex="-1" data-action="clear">×</button>`
              : ''
          }
          <span class="vselect-indicator" aria-hidden="true">▾</span>
        </div>
      </div>
      <div class="vselect-menu" role="tree" ${isOpen ? '' : 'hidden'}>
        ${
          filtered.length === 0
            ? `<div class="vselect-tree-empty">${escapeText(args.emptyText ?? 'No matches')}</div>`
            : filtered.map((n) => renderNode(n, selectedSet, expanded)).join('')
        }
      </div>
    `

    wireEvents()

    if (wasSearchFocused) {
      const fresh = mount.querySelector<HTMLInputElement>('input.vselect-search')
      if (fresh) {
        fresh.focus()
        if (caretStart !== null && caretEnd !== null) {
          // Best-effort caret restore — input.value is set from `query` so
          // the offsets line up with what the user just typed.
          try {
            fresh.setSelectionRange(caretStart, caretEnd)
          } catch {
            // Some input types reject setSelectionRange; ignore.
          }
        }
      }
    }
  }

  function wireEvents(): void {
    const search = mount.querySelector<HTMLInputElement>('input.vselect-search')!

    // Control click → toggle open. Skip when the click landed on the search
    // input or a tag-remove (those have their own handlers).
    mount
      .querySelector<HTMLElement>('[data-action="toggle-open"]')!
      .addEventListener('mousedown', (e) => {
        const tgt = e.target as HTMLElement
        if (tgt.closest('.vselect-search') || tgt.closest('.vselect-tag-remove')) return
        if (tgt.closest('[data-action="clear"]')) return
        e.preventDefault()
        isOpen = !isOpen
        render()
        if (isOpen) {
          // After render the captured `search` is detached — query the fresh node.
          const fresh = mount.querySelector<HTMLInputElement>('input.vselect-search')
          fresh?.focus()
        }
      })

    search.addEventListener('input', () => {
      query = search.value
      if (!isOpen) isOpen = true
      render()
      // render() already re-focused the (fresh) search input via the
      // wasSearchFocused branch — nothing more to do here.
    })
    search.addEventListener('focus', () => {
      if (!isOpen) {
        isOpen = true
        render()
      }
    })

    mount.querySelectorAll<HTMLElement>('[data-action="remove"]').forEach((el) => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const value = el.dataset.value
        selected = selected.filter((v) => String(v) !== value)
        emit()
        render()
      })
    })

    const clearBtn = mount.querySelector<HTMLElement>('[data-action="clear"]')
    if (clearBtn) {
      clearBtn.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        selected = []
        emit()
        render()
      })
    }

    mount.querySelectorAll<HTMLElement>('[data-action="expand"]').forEach((el) => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault()
        const id = el.dataset.id!
        if (expanded.has(id)) expanded.delete(id)
        else expanded.add(id)
        render()
      })
    })

    mount.querySelectorAll<HTMLInputElement>('input[data-action="toggle"]').forEach((el) => {
      el.addEventListener('change', () => {
        const id = el.dataset.id!
        const node = findNodeById(tree, id)
        if (!node || node.disabled) return
        selected = toggleNode(node, selected)
        emit()
        render()
      })
    })

    mount.querySelectorAll<HTMLElement>('[data-action="toggle-label"]').forEach((el) => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault()
        const id = el.dataset.id!
        const node = findNodeById(tree, id)
        if (!node || node.disabled) return
        selected = toggleNode(node, selected)
        emit()
        render()
      })
    })

    // Set indeterminate flags after render — runtime-only property.
    const selectedSet = new Set(selected)
    mount.querySelectorAll<HTMLInputElement>('input[data-action="toggle"]').forEach((el) => {
      const id = el.dataset.id!
      const node = findNodeById(tree, id)
      if (!node) return
      el.indeterminate = checkStateOf(node, selectedSet) === 'indeterminate'
    })
  }

  // Outside click closes the menu. Bound once at startup; reads `isOpen`
  // from closure on every event.
  document.addEventListener('mousedown', (event) => {
    if (!isOpen) return
    const target = event.target as Node | null
    if (!target) return
    if (mount.contains(target)) return
    isOpen = false
    render()
  })

  emit()
  render()

  return {
    setTheme(next) {
      theme = next
      render()
    },
  }
}

function renderNode<T>(
  node: NormalizedTreeNode<T>,
  selected: ReadonlySet<unknown>,
  expanded: ReadonlySet<string>,
): string {
  const state = checkStateOf(node, selected)
  const isOpen = expanded.has(node.id)
  const isLeaf = node.isLeaf
  const indent = 8 + node.depth * 18
  const childrenHtml =
    !isLeaf && isOpen && node.children.length > 0
      ? `<div class="vselect-tree-children" role="group">${node.children
          .map((c) => renderNode(c, selected, expanded))
          .join('')}</div>`
      : ''
  return `
    <div class="vselect-tree-branch" role="treeitem" aria-selected="${state === 'checked'}" ${
      isLeaf ? '' : `aria-expanded="${isOpen}"`
    }>
      <div class="vselect-tree-row${node.disabled ? ' is-disabled' : ''}" style="padding-left:${indent}px">
        <button type="button" class="vselect-tree-expander${isLeaf ? ' is-leaf' : ''}${
          isOpen ? ' is-open' : ''
        }" aria-label="${isOpen ? 'Collapse' : 'Expand'}" data-action="expand" data-id="${escapeAttr(
          node.id,
        )}">${isLeaf ? '' : isOpen ? '▾' : '▸'}</button>
        <input type="checkbox" class="vselect-tree-checkbox" data-action="toggle" data-id="${escapeAttr(
          node.id,
        )}" ${state === 'checked' ? 'checked' : ''} ${node.disabled ? 'disabled' : ''} />
        <span class="vselect-tree-label" data-action="toggle-label" data-id="${escapeAttr(
          node.id,
        )}">${escapeText(node.label)}</span>
      </div>
      ${childrenHtml}
    </div>
  `
}

function findNodeById<T>(tree: NormalizedTreeNode<T>[], id: string): NormalizedTreeNode<T> | null {
  for (const node of tree) {
    if (node.id === id) return node
    const inChildren = findNodeById(node.children, id)
    if (inChildren) return inChildren
  }
  return null
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
