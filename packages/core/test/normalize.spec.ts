import { describe, expect, it, vi } from 'vitest'
import { normalize } from '@/normalize'
import { resetWarnings } from '@/warn'

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

describe('normalize  label coercion', () => {
  it('does not render a non-primitive label as "[object Object]"', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    resetWarnings()

    // An i18n record is the realistic way to hit this. The coerced string also
    // reached the collapsed control's accessible name and the tag remove
    // button's aria-label ("Remove [object Object]").
    const [option] = normalize([{ value: 'a', label: { en: 'Apple' } }] as never, {})

    expect(option?.label).not.toContain('[object')
    expect(option?.label).toBe('a')
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  it('warns once, not once per option per render', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    resetWarnings()

    const bad = [
      { value: 'a', label: { en: 'A' } },
      { value: 'b', label: { en: 'B' } },
    ] as never
    normalize(bad, {})
    normalize(bad, {})

    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  it('keeps ids unique and free of coerced objects for object values', () => {
    const options = normalize([{ value: { id: 1 } }, { value: { id: 2 } }] as never, {})
    const ids = options.map((o) => o.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.some((id) => id.includes('[object'))).toBe(false)
  })
})
