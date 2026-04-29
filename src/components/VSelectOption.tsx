import { defineComponent, type PropType, type SlotsType } from 'vue'
import type { NormalizedOption, OptionLike } from '@/types/option'
import { CheckIcon } from '@/components/icons'

export interface VSelectOptionDefaultSlotProps {
  option: NormalizedOption<OptionLike>
  selected: boolean
  active: boolean
  disabled: boolean
}

export default defineComponent({
  name: 'VSelectOption',
  inheritAttrs: false,
  props: {
    option: { type: Object as PropType<NormalizedOption<OptionLike>>, required: true },
    selected: { type: Boolean, required: true },
    active: { type: Boolean, required: true },
    /** DOM id used by the combobox's `aria-activedescendant`. */
    domId: { type: String, required: true },
  },
  emits: {
    pick: (_option: NormalizedOption<OptionLike>, _event: MouseEvent) => true,
    highlight: (_option: NormalizedOption<OptionLike>) => true,
  },
  slots: Object as SlotsType<{
    default?: (props: VSelectOptionDefaultSlotProps) => unknown
  }>,
  setup(props, { emit, slots }) {
    function onMousedown(event: MouseEvent) {
      // Mousedown rather than click — fires before blur, keeping focus inside.
      event.preventDefault()
      if (props.option.disabled) return
      emit('pick', props.option, event)
    }

    return () => {
      const slotProps: VSelectOptionDefaultSlotProps = {
        option: props.option,
        selected: props.selected,
        active: props.active,
        disabled: props.option.disabled || false,
      }

      return (
        <div
          id={props.domId}
          class={[
            'vselect-option',
            {
              'is-active': props.active,
              'is-selected': props.selected,
              'is-disabled': props.option.disabled,
            },
          ]}
          role="option"
          aria-selected={props.selected}
          aria-disabled={props.option.disabled || undefined}
          onMousemove={() => emit('highlight', props.option)}
          onMousedown={onMousedown}
        >
          {slots.default ? (
            slots.default(slotProps)
          ) : (
            <>
              <span class="vselect-option-label">{props.option.label}</span>
              {props.selected && (
                <span class="vselect-option-check">
                  <CheckIcon />
                </span>
              )}
            </>
          )}
        </div>
      )
    }
  },
})
