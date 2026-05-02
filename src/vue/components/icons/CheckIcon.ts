import { defineComponent, h } from 'vue'

export const CheckIcon = defineComponent({
  name: 'VsCheck',
  setup() {
    return () =>
      h(
        'svg',
        {
          viewBox: '0 0 20 20',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 2.5,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'aria-hidden': 'true',
        },
        [h('polyline', { points: '4 11 8 15 16 6' })],
      )
  },
})
