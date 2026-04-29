import { describe, expect, it } from 'vitest'
import { defaultFilter, escapeRegex } from '@/core/filter'
import type { NormalizedOption } from '@/types/option'

function opt(label: string): NormalizedOption {
  return { id: label, value: label, label, raw: label }
}

describe('defaultFilter', () => {
  it('matches everything when query is empty', () => {
    expect(defaultFilter('', opt('Anything'))).toBe(true)
  })

  it('matches case-insensitively by default', () => {
    expect(defaultFilter('app', opt('Apple'))).toBe(true)
    expect(defaultFilter('APP', opt('Apple'))).toBe(true)
  })

  it('respects case-sensitive flag', () => {
    expect(defaultFilter('app', opt('Apple'), true)).toBe(false)
    expect(defaultFilter('App', opt('Apple'), true)).toBe(true)
  })

  it('rejects non-matches', () => {
    expect(defaultFilter('xyz', opt('Apple'))).toBe(false)
  })
})

describe('escapeRegex', () => {
  it('escapes regex special characters', () => {
    expect(escapeRegex('a.b+c*d?')).toBe('a\\.b\\+c\\*d\\?')
  })
})
