import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, type CSSProperties } from 'vue'
import { useFloatingMenu } from '@/composables/useFloatingMenu'

// jsdom gives every element a zero rect and does no layout, so positioning has
// to be driven from stubbed rects. That is fine  the arithmetic is exactly
// what we want to pin down.

const VIEWPORT = { width: 1000, height: 800 }

function stubRect(el: HTMLElement, rect: Partial<DOMRect>) {
  const full = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, ...rect }
  el.getBoundingClientRect = () => ({ ...full, toJSON: () => full })
}

let scope: ReturnType<typeof effectScope>
let anchorEl: HTMLElement
let menuEl: HTMLElement

beforeEach(() => {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: VIEWPORT.width,
    configurable: true,
  })
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: VIEWPORT.height,
    configurable: true,
  })
  anchorEl = document.createElement('div')
  menuEl = document.createElement('div')
  document.body.append(anchorEl, menuEl)
})

afterEach(() => {
  scope?.stop()
  anchorEl.remove()
  menuEl.remove()
  vi.restoreAllMocks()
})

/** Run the composable inside a scope so onScopeDispose is exercised. */
async function run(
  teleportTo: string | HTMLElement | false,
  rects: { anchor: Partial<DOMRect>; menu: Partial<DOMRect> },
) {
  stubRect(anchorEl, rects.anchor)
  stubRect(menuEl, rects.menu)

  const reference = ref<HTMLElement | null>(null)
  const floatingEl = ref<HTMLElement | null>(null)
  scope = effectScope()
  const api = scope.run(() =>
    useFloatingMenu(reference, floatingEl, { teleportTo: ref(teleportTo) }),
  )!

  // Mount order mirrors the components: refs land after the menu renders.
  reference.value = anchorEl
  floatingEl.value = menuEl
  await nextTick()
  return api
}

const px = (styles: CSSProperties | undefined, key: 'top' | 'left' | 'minWidth') =>
  Number.parseFloat(String(styles?.[key] ?? ''))

describe('useFloatingMenu  in-flow (teleportTo: false)', () => {
  // The whole reason for replacing @floating-ui/vue: useFloating() ran
  // unconditionally, so a DEFAULT select built a ResizeObserver, attached four
  // window scroll/resize listeners, computed a position and then discarded it
  // because `floating` was false.
  it('attaches no observers or listeners at all', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    let observers = 0
    const RealRO = globalThis.ResizeObserver
    class CountingRO {
      constructor() {
        observers += 1
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    globalThis.ResizeObserver = CountingRO

    const api = await run(false, {
      anchor: { top: 100, bottom: 130, left: 50, width: 200, height: 30 },
      menu: { width: 200, height: 150 },
    })

    expect(observers).toBe(0)
    expect(addSpy.mock.calls.filter((c) => c[0] === 'scroll' || c[0] === 'resize')).toHaveLength(0)
    expect(api.styles.value).toBeUndefined()
    expect(api.floating.value).toBe(false)
    expect(api.target.value).toBeNull()

    globalThis.ResizeObserver = RealRO
  })
})

describe('useFloatingMenu  floating', () => {
  it('places the menu below the control, offset by the gap', async () => {
    const api = await run('body', {
      anchor: { top: 100, bottom: 130, left: 50, width: 200, height: 30 },
      menu: { width: 200, height: 150 },
    })

    expect(api.styles.value?.position).toBe('fixed')
    expect(px(api.styles.value, 'top')).toBe(136) // bottom 130 + gap 6
    expect(px(api.styles.value, 'left')).toBe(50)
  })

  it('matches the control width via minWidth', async () => {
    const api = await run('body', {
      anchor: { top: 100, bottom: 130, left: 50, width: 240, height: 30 },
      menu: { width: 120, height: 100 },
    })

    expect(px(api.styles.value, 'minWidth')).toBe(240)
  })

  it('flips above when there is no room below', async () => {
    // Control near the bottom edge: 800 - 780 - 6 - 8 = 6px below, 766 above.
    const api = await run('body', {
      anchor: { top: 750, bottom: 780, left: 50, width: 200, height: 30 },
      menu: { width: 200, height: 300 },
    })

    expect(px(api.styles.value, 'top')).toBe(444) // 750 - 6 - 300
  })

  it('stays below when neither side fits but below is roomier', async () => {
    // A menu taller than both gaps must not flip to the *worse* side.
    const api = await run('body', {
      anchor: { top: 40, bottom: 70, left: 50, width: 200, height: 30 },
      menu: { width: 200, height: 900 },
    })

    expect(px(api.styles.value, 'top')).toBe(76) // still below
  })

  it('clamps a menu that would overflow the right edge', async () => {
    const api = await run('body', {
      anchor: { top: 100, bottom: 130, left: 900, width: 200, height: 30 },
      menu: { width: 300, height: 100 },
    })

    // 1000 - 300 - 8 = 692
    expect(px(api.styles.value, 'left')).toBe(692)
  })

  it('pins to the left edge rather than the right when wider than the viewport', async () => {
    const api = await run('body', {
      anchor: { top: 100, bottom: 130, left: 20, width: 200, height: 30 },
      menu: { width: 1400, height: 100 },
    })

    expect(px(api.styles.value, 'left')).toBe(8)
  })

  it('repositions on scroll and cleans up when the scope stops', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    await run('body', {
      anchor: { top: 100, bottom: 130, left: 50, width: 200, height: 30 },
      menu: { width: 200, height: 150 },
    })

    // Capture phase, so scrolls in ancestor containers are heard too  those
    // do not bubble.
    const scrollCall = addSpy.mock.calls.find((c) => c[0] === 'scroll')
    expect(scrollCall?.[2]).toBe(true)
    expect(addSpy.mock.calls.some((c) => c[0] === 'resize')).toBe(true)

    scope.stop()

    expect(removeSpy.mock.calls.some((c) => c[0] === 'scroll')).toBe(true)
    expect(removeSpy.mock.calls.some((c) => c[0] === 'resize')).toBe(true)
  })

  it('resolves the teleport target', async () => {
    const api = await run('#app', {
      anchor: { top: 0, bottom: 0, left: 0, width: 0, height: 0 },
      menu: { width: 0, height: 0 },
    })
    expect(api.target.value).toBe('#app')
    expect(api.floating.value).toBe(true)
  })
})
