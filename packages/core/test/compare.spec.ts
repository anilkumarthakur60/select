import { describe, expect, it } from 'vitest'
import { toggleValue, valuesEqual } from '@/compare'

describe('valuesEqual', () => {
  it('matches identical primitives', () => {
    expect(valuesEqual('a', 'a')).toBe(true)
    expect(valuesEqual(1, 1)).toBe(true)
  })

  it('rejects different primitives', () => {
    expect(valuesEqual('a', 'b')).toBe(false)
    expect(valuesEqual(1, 2)).toBe(false)
  })

  it('compares objects by reference only', () => {
    const ref = { a: 1 }
    expect(valuesEqual(ref, ref)).toBe(true)
    expect(valuesEqual({ a: 1 }, { a: 1 })).toBe(false)
  })

  it('treats null/undefined as not-equal to other values', () => {
    expect(valuesEqual(null, undefined)).toBe(false)
    expect(valuesEqual(null, 0)).toBe(false)
  })
})

describe('toggleValue', () => {
  it('adds when missing', () => {
    expect(toggleValue([1, 2], 3)).toEqual([1, 2, 3])
  })

  it('removes when present', () => {
    expect(toggleValue([1, 2, 3], 2)).toEqual([1, 3])
  })

  it('returns a new array (does not mutate)', () => {
    const input = [1, 2]
    const output = toggleValue(input, 3)
    expect(output).not.toBe(input)
    expect(input).toEqual([1, 2])
  })
})

describe('equality relation (SameValueZero)', () => {
  // valuesEqual used strict ===, but the machine's isSelected() used
  // `new Set(selected).has(value)` — SameValueZero. They disagreed on NaN, and
  // that made selection a one-way door: isSelected reported true so a click
  // took the deselect branch, but the removal filter matched nothing. Every
  // subsequent click fired onDeselect (running consumer handlers, analytics,
  // possibly a server write) while the value stayed selected forever.
  it('treats NaN as equal to itself, matching Set/Map lookups', () => {
    expect(valuesEqual(NaN, NaN)).toBe(true)
    expect(new Set([NaN]).has(NaN)).toBe(valuesEqual(NaN, NaN))
  })

  it('toggleValue removes NaN instead of appending a duplicate', () => {
    expect(toggleValue([NaN], NaN)).toEqual([])
    expect(toggleValue([], NaN)).toHaveLength(1)
  })

  it('keeps object comparison by reference', () => {
    const a = { id: 1 }
    expect(valuesEqual(a, a)).toBe(true)
    expect(valuesEqual(a, { id: 1 })).toBe(false)
  })

  it('agrees with Set on +0/-0', () => {
    expect(valuesEqual(0, -0)).toBe(new Set([0]).has(-0))
  })
})
