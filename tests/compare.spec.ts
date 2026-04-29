import { describe, expect, it } from 'vitest'
import { toggleValue, valuesEqual } from '@/core/compare'

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
