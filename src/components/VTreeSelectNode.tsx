import { computed, defineComponent, ref, watch, type PropType } from 'vue'
import type { NormalizedTreeNode, TreeNodeCheckState, TreeOptionLike } from '@/types/tree-node'
import { ChevronDownIcon } from '@/components/icons'

const VTreeSelectNode = defineComponent({
  name: 'VTreeSelectNode',
  inheritAttrs: false,
  props: {
    node: { type: Object as PropType<NormalizedTreeNode<TreeOptionLike>>, required: true },
    /** Set of expanded node ids — passed in for shared state across the tree. */
    expanded: { type: Object as PropType<Set<string>>, required: true },
    /** Resolver for the tri-state of any node, leaf or parent. */
    getCheckState: {
      type: Function as PropType<(node: NormalizedTreeNode<TreeOptionLike>) => TreeNodeCheckState>,
      required: true,
    },
    /** DOM-id prefix from the parent VTreeSelect (used by aria wiring). */
    idPrefix: { type: String, required: true },
  },
  emits: {
    toggle: (_node: NormalizedTreeNode<TreeOptionLike>) => true,
    expand: (_node: NormalizedTreeNode<TreeOptionLike>) => true,
    collapse: (_node: NormalizedTreeNode<TreeOptionLike>) => true,
  },
  setup(props, { emit }) {
    // Local mirror of `expanded.has(node.id)` so the chevron animates without
    // requiring the parent to re-render every node on every toggle.
    const isExpanded = ref(props.expanded.has(props.node.id))
    watch(
      () => props.expanded,
      (set) => {
        isExpanded.value = set.has(props.node.id)
      },
      { deep: true },
    )

    const checkState = computed(() => props.getCheckState(props.node))
    const checked = computed(() => checkState.value === 'checked')
    const indeterminate = computed(() => checkState.value === 'indeterminate')

    const rowStyle = computed(() => ({
      // 18px expander + 8px gap → align children under the parent's label.
      paddingLeft: `${8 + props.node.depth * 22}px`,
    }))

    const checkboxRef = ref<HTMLInputElement | null>(null)

    // Native checkboxes don't accept `:indeterminate` as an attribute — it has
    // to be set imperatively on the DOM element.
    watch(
      indeterminate,
      (v) => {
        if (checkboxRef.value) checkboxRef.value.indeterminate = v
      },
      { immediate: true, flush: 'post' },
    )

    function onExpanderClick(event: MouseEvent) {
      event.stopPropagation()
      if (props.node.isLeaf) return
      if (isExpanded.value) emit('collapse', props.node)
      else emit('expand', props.node)
    }

    function onRowMousedown(event: MouseEvent) {
      // Toggle-on-row-click is a common UX shortcut; the checkbox swallows its
      // own click so we don't double-toggle.
      if (event.target instanceof HTMLInputElement) return
      if (props.node.disabled) return
      event.preventDefault()
      emit('toggle', props.node)
    }

    function onCheckboxChange() {
      emit('toggle', props.node)
    }

    return () => (
      <div class="vselect-tree-branch" role="none">
        <div
          id={`${props.idPrefix}-node-${props.node.id}`}
          class={['vselect-tree-row', { 'is-disabled': props.node.disabled }]}
          role="treeitem"
          aria-level={props.node.depth + 1}
          aria-expanded={props.node.isLeaf ? undefined : isExpanded.value}
          aria-checked={indeterminate.value ? 'mixed' : checked.value}
          aria-disabled={props.node.disabled || undefined}
          style={rowStyle.value}
          onMousedown={onRowMousedown}
        >
          <button
            type="button"
            class={[
              'vselect-tree-expander',
              { 'is-leaf': props.node.isLeaf, 'is-open': isExpanded.value },
            ]}
            aria-label={props.node.isLeaf ? undefined : isExpanded.value ? 'Collapse' : 'Expand'}
            tabindex={props.node.isLeaf ? -1 : 0}
            onMousedown={(e: MouseEvent) => e.stopPropagation()}
            onClick={onExpanderClick}
          >
            {!props.node.isLeaf && <ChevronDownIcon />}
          </button>

          <input
            ref={(el) => {
              checkboxRef.value = el as HTMLInputElement | null
            }}
            type="checkbox"
            class="vselect-tree-checkbox"
            checked={checked.value}
            disabled={props.node.disabled}
            aria-label={props.node.label}
            onChange={onCheckboxChange}
            onClick={(e: MouseEvent) => e.stopPropagation()}
          />

          <span class="vselect-tree-label">{props.node.label}</span>
        </div>

        {!props.node.isLeaf && isExpanded.value && props.node.children.length > 0 && (
          <div class="vselect-tree-children" role="group">
            {props.node.children.map((child) => (
              <VTreeSelectNode
                key={child.id}
                node={child}
                expanded={props.expanded}
                getCheckState={props.getCheckState}
                idPrefix={props.idPrefix}
                onToggle={(n: NormalizedTreeNode<TreeOptionLike>) => emit('toggle', n)}
                onExpand={(n: NormalizedTreeNode<TreeOptionLike>) => emit('expand', n)}
                onCollapse={(n: NormalizedTreeNode<TreeOptionLike>) => emit('collapse', n)}
              />
            ))}
          </div>
        )}
      </div>
    )
  },
})

export default VTreeSelectNode
