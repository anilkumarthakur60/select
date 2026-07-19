import { onScopeDispose, ref, watch, type Ref } from 'vue'

export interface UseDebouncedReturn<T> {
  /** Debounced mirror of the source. Updates `delay` ms after the source settles. */
  debounced: Ref<T>
  /** Apply the most recent pending value immediately. No-op when nothing is pending. */
  flush: () => void
  /** Discard the pending value. The debounced ref keeps its current value. */
  cancel: () => void
  /**
   * Cancel any pending update and synchronously set the debounced ref. Use
   * when external state (e.g. selection / clear) needs the downstream effect
   * to fire *now* instead of waiting out the next trailing edge.
   */
  force: (value: T) => void
}

/**
 * Debounces a reactive source. The returned `debounced` ref updates `delay`
 * ms after the source last changed; `flush()` and `cancel()` give callers
 * control over the trailing edge — useful when the user presses Enter in an
 * async picker and expects the request to fire **now**, not after the wait.
 *
 * `delay` is itself a ref so consumers can flip the prop at runtime; passing
 * `0` or `undefined` makes the debounced ref shadow the source synchronously.
 *
 * The pending timer is cancelled when the surrounding effect scope is
 * disposed (component unmount, explicit scope), so this is safe to call from
 * a regular `setup()` body without manual cleanup.
 */
export function useDebounced<T>(
  source: Ref<T>,
  delay: Ref<number | undefined> | number | undefined,
): UseDebouncedReturn<T> {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: T = source.value
  let hasPending = false

  const getDelay = () => {
    const raw = typeof delay === 'object' && delay !== null ? delay.value : delay
    return typeof raw === 'number' && raw > 0 ? raw : 0
  }

  function cancel() {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    hasPending = false
  }

  function flush() {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
    if (hasPending) {
      debounced.value = pending
      hasPending = false
    }
  }

  watch(source, (next) => {
    const ms = getDelay()
    if (ms === 0) {
      cancel()
      debounced.value = next
      return
    }
    pending = next
    hasPending = true
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = pending
      timer = undefined
      hasPending = false
    }, ms)
  })

  // If `delay` is reactive and drops to 0 mid-flight, honour the new
  // contract by flushing whatever is pending.
  if (typeof delay === 'object' && delay !== null) {
    watch(delay, (ms) => {
      if (!ms || ms <= 0) flush()
    })
  }

  function force(value: T) {
    cancel()
    debounced.value = value
  }

  onScopeDispose(cancel)

  return { debounced, flush, cancel, force }
}
