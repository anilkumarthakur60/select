import { getCurrentInstance, nextTick } from 'vue'

/**
 * `nextTick(cb)` with the rejection routed back into Vue's error handling.
 *
 * Vue's `nextTick(fn)` returns `promise.then(fn)` and does NOT wrap `fn` in
 * `callWithAsyncErrorHandling`. Discarding that promise — which every call site
 * here used to do — meant a throw inside the callback became an unhandled
 * rejection that bypassed Vue entirely: `app.config.errorHandler` was called
 * zero times, so an app doing error reporting through the Vue integration was
 * blind to it. Under a Node runner with `--unhandled-rejections=strict` it
 * terminates the process.
 *
 * That was reachable through ordinary data, not just exotic failures: these
 * callbacks fire on open and on every arrow keypress, so one throwing
 * environment (a `scrollIntoView` polyfill, an older browser, a non-browser
 * DOM) produced a steady stream of unattributable rejections.
 */
export function afterTick(callback: () => void): void {
  const instance = getCurrentInstance()
  void nextTick(callback).catch((error: unknown) => {
    const handler = instance?.appContext.config.errorHandler
    if (handler) {
      handler(error, instance?.proxy ?? null, 'nextTick')
      return
    }
    // No app-level handler configured: surface it rather than swallowing it.
    console.error(error)
  })
}
