import { describe, expect, it } from 'vitest'
import { normalize } from '@/core/normalize'

describe('normalize', () => {
  it('turns primitives into label/value pairs', () => {
    const result = normalize(['Apple', 'Banana'], {})
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ value: 'Apple', label: 'Apple' })
    expect(result[1]).toMatchObject({ value: 'Banana', label: 'Banana' })
  })

  it('reads value/label from object options via accessors', () => {
    const options = [
      { code: 'us', name: 'United States' },
      { code: 'fr', name: 'France' },
    ]
    const result = normalize(options, { optionValue: 'code', optionLabel: 'name' })
    expect(result[0]).toMatchObject({ value: 'us', label: 'United States' })
    expect(result[1]).toMatchObject({ value: 'fr', label: 'France' })
  })

  it('supports function accessors for derived labels', () => {
    const options = [{ first: 'Ada', last: 'Lovelace' }]
    const result = normalize(options, {
      optionValue: (o) => `${o.first}-${o.last}`,
      optionLabel: (o) => `${o.first} ${o.last}`,
    })
    expect(result[0]).toMatchObject({ value: 'Ada-Lovelace', label: 'Ada Lovelace' })
  })

  it('passes through group and disabled flags', () => {
    const options = [{ value: 1, label: 'A', region: 'X', disabled: true }]
    const result = normalize(options, { optionGroup: 'region' })
    expect(result[0]?.group).toBe('X')
    expect(result[0]?.disabled).toBe(true)
  })

  it('preserves the raw option', () => {
    const raw = { code: 'a', name: 'A', extra: { nested: true } }
    const [out] = normalize([raw], { optionValue: 'code', optionLabel: 'name' })
    expect(out?.raw).toBe(raw)
  })
})
