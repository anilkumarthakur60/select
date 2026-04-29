import { defineComponent, type PropType, type SlotsType } from 'vue'
import type { NormalizedOption, OptionLike } from '@/types/option'
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

    return () => (
      <span class="vselect-tag" data-value={String(props.option.value)}>
        <span class="vselect-tag-label">{props.option.label}</span>
        {!props.disabled && (
          <button
            type="button"
            class="vselect-tag-remove"
            aria-label={props.removeLabel ?? `Remove ${props.option.label}`}
            tabindex={-1}
            onMousedown={onRemove}
          >
            <CloseIcon />
          </button>
        )}
      </span>
    )
  },
})
