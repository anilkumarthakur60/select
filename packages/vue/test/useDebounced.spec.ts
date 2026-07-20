import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useDebounced } from '@/composables/useDebounced'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDebounced', () => {
  it('initialises debounced to the source value', () => {
    const source = ref('hi')
    const { debounced } = useDebounced(source, 100)
    expect(debounced.value).toBe('hi')
  })

  it('passes through synchronously when delay is 0', async () => {
    const source = ref('a')
    const { debounced } = useDebounced(source, 0)
    source.value = 'b'
    await nextTick()
    expect(debounced.value).toBe('b')
  })

  it('passes through synchronously when delay is undefined', async () => {
    const source = ref('a')
    const { debounced } = useDebounced(source, undefined)
    source.value = 'b'
    await nextTick()
    expect(debounced.value).toBe('b')
  })

  it('delays propagation by the given ms', async () => {
    const source = ref('a')
    const { debounced } = useDebounced(source, 200)
    source.value = 'b'
    await nextTick()
    expect(debounced.value).toBe('a')
    vi.advanceTimersByTime(199)
    expect(debounced.value).toBe('a')
    vi.advanceTimersByTime(1)
    expect(debounced.value).toBe('b')
  })

  it('coalesces rapid changes — only the last value lands', async () => {
    const source = ref('')
    const { debounced } = useDebounced(source, 100)

    source.value = 'a'
    await nextTick()
    vi.advanceTimersByTime(50)
    source.value = 'ab'
    await nextTick()
    vi.advanceTimersByTime(50)
    source.value = 'abc'
    await nextTick()
    vi.advanceTimersByTime(99)
    expect(debounced.value).toBe('')
    vi.advanceTimersByTime(1)
    expect(debounced.value).toBe('abc')
  })

  it('flush() applies the pending value immediately', async () => {
    const source = ref('a')
    const { debounced, flush } = useDebounced(source, 1000)
    source.value = 'b'
    await nextTick()
    expect(debounced.value).toBe('a')
    flush()
    expect(debounced.value).toBe('b')
  })

  it('cancel() drops the pending value and keeps the current debounced', async () => {
    const source = ref('a')
    const { debounced, cancel } = useDebounced(source, 500)
    source.value = 'b'
    await nextTick()
    cancel()
    vi.advanceTimersByTime(1000)
    expect(debounced.value).toBe('a')
  })

  it('force(value) cancels pending and sets debounced synchronously', async () => {
    const source = ref('a')
    const { debounced, force } = useDebounced(source, 500)
    source.value = 'b'
    await nextTick()
    force('reset')
    expect(debounced.value).toBe('reset')
    vi.advanceTimersByTime(1000)
    // Pending 'b' was cancelled — does not overwrite our forced reset.
    expect(debounced.value).toBe('reset')
  })

  it('honours a reactive delay — flushes pending when delay drops to 0', async () => {
    const source = ref('a')
    const delay = ref<number | undefined>(500)
    const { debounced } = useDebounced(source, delay)
    source.value = 'b'
    await nextTick()
    expect(debounced.value).toBe('a')
    delay.value = 0
    await nextTick()
    // The reactive-delay watcher flushes whatever's pending.
    expect(debounced.value).toBe('b')
  })

  it('clears pending timers when the surrounding scope is disposed', async () => {
    const source = ref('a')
    const scope = effectScope()
    const debouncedRef = scope.run(() => useDebounced(source, 200).debounced)!
    source.value = 'b'
    await nextTick()
    scope.stop()
    vi.advanceTimersByTime(500)
    // The disposed scope's timer was cancelled; debounced still holds 'a'.
    expect(debouncedRef.value).toBe('a')
  })
})
