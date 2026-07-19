import { defineComponent, h } from 'vue'

export const CloseIcon = defineComponent({
  name: 'VsClose',
  setup() {
    return () =>
      h(
        'svg',
        {
          viewBox: '0 0 20 20',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 2,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'aria-hidden': 'true',
        },
        [h('line', { x1: 5, y1: 5, x2: 15, y2: 15 }), h('line', { x1: 15, y1: 5, x2: 5, y2: 15 })],
      )
  },
})
