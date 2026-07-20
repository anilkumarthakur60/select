import { defineComponent, type PropType, type SlotsType } from 'vue'
import type { NormalizedOption, OptionLike } from '@anil-labs/select-core'
import { CloseIcon } from '@/components/icons'

export default defineComponent({
  name: 'VSelectTag',
  inheritAttrs: false,
  props: {
    option: { type: Object as PropType<NormalizedOption<OptionLike>>, required: true },
    disabled: { type: Boolean, default: false },
    removeLabel: { type: String, default: undefined },
  },
  emits: {
    remove: (_option: NormalizedOption<OptionLike>, _event: MouseEvent) => true,
  },
  slots: Object as SlotsType<{ default?: () => unknown }>,
  setup(props, { emit }) {
    function onRemove(event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()
      emit('remove', props.option, event)
    }

    /**
     * Keyboard activation. Enter and Space on a `<button>` arrive as a `click`,
     * never a `mousedown`, so the mousedown-only handler was inert without a
     * pointer — and `tabindex={-1}` meant the button could not be reached by
     * Tab either. Backspace was the only keyboard removal path, and it always
     * pops the LAST tag, so a middle tag could not be removed without
     * destroying the ones after it.
     *
     * `event.detail === 0` marks a keyboard-synthesised click (a pointer click
     * reports its click-count), so a mouse press does not run both handlers.
     */
    function onRemoveActivate(event: MouseEvent) {
      if (event.detail !== 0) return
      onRemove(event)
    }

    return () => (
      <span class="vselect-tag" data-value={String(props.option.value)}>
        <span class="vselect-tag-label">{props.option.label}</span>
        {!props.disabled && (
          <button
            type="button"
            class="vselect-tag-remove"
            aria-label={props.removeLabel ?? `Remove ${props.option.label}`}
            tabindex={0}
            onMousedown={onRemove}
            onClick={onRemoveActivate}
          >
            <CloseIcon />
          </button>
        )}
      </span>
    )
  },
})
