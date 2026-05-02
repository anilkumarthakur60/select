import { defineComponent, h } from 'vue'

export const ChevronDownIcon = defineComponent({
  name: 'VsChevronDown',
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
        [h('polyline', { points: '5 8 10 13 15 8' })],
      )
  },
})
