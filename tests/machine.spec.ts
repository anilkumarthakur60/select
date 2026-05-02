import { describe, expect, it, vi } from 'vitest'
import { createSelectMachine } from '@/core/machine'

describe('createSelectMachine', () => {
  describe('selection', () => {
    it('selects a single value', () => {
      const onChange = vi.fn()
      const m = createSelectMachine({
        options: ['a', 'b', 'c'],
        mode: 'single',
        onChange,
      })
      const opt = m.getNormalizedOptions()[1]!
      m.selectOption(opt)
      expect(onChange).toHaveBeenCalledWith('b')
      expect(m.getState().selectedValues).toEqual(['b'])
    })

    it('toggles values in multi mode', () => {
      const onChange = vi.fn()
      const m = createSelectMachine({
        options: ['a', 'b', 'c'],
        mode: 'multiple',
        onChange,
      })
      const [a, b] = m.getNormalizedOptions()
      m.selectOption(a!)
      m.selectOption(b!)
      expect(m.getState().selectedValues).toEqual(['a', 'b'])
      m.selectOption(a!)
      expect(m.getState().selectedValues).toEqual(['b'])
    })

    it('respects maxSelections', () => {
      const m = createSelectMachine({
        options: ['a', 'b', 'c'],
        mode: 'multiple',
        maxSelections: 2,
      })
      const [a, b, c] = m.getNormalizedOptions()
      m.selectOption(a!)
      m.selectOption(b!)
      m.selectOption(c!)
      expect(m.getState().selectedValues).toEqual(['a', 'b'])
    })

    it('clear() empties multi selection', () => {
      const m = createSelectMachine({
        options: ['a', 'b'],
        mode: 'multiple',
        modelValue: ['a', 'b'],
      })
      m.clear()
      expect(m.getState().selectedValues).toEqual([])
    })
  })

  describe('menu state', () => {
    it('open/close/toggle', () => {
      const m = createSelectMachine({ options: ['a'] })
      expect(m.getState().isOpen).toBe(false)
      m.open()
      expect(m.getState().isOpen).toBe(true)
      m.toggle()
      expect(m.getState().isOpen).toBe(false)
    })

    it('does not open when disabled', () => {
      const m = createSelectMachine({ options: ['a'], disabled: true })
      m.open()
      expect(m.getState().isOpen).toBe(false)
    })

    it('moveActive wraps and skips disabled', () => {
      const m = createSelectMachine({
        options: [
          { id: 1, label: 'a' },
          { id: 2, label: 'b', disabled: true },
          { id: 3, label: 'c' },
        ],
        optionValue: 'id',
        optionDisabled: 'disabled',
      })
      m.open()
      // open() lands on the first enabled option
      expect(m.getState().activeIndex).toBe(0)
      m.moveActive(1)
      // skips the disabled one in the middle
      expect(m.getState().activeIndex).toBe(2)
      m.moveActive(1)
      // wraps back to the first enabled one
      expect(m.getState().activeIndex).toBe(0)
    })
  })

  describe('search / filter', () => {
    it('filters by query (default substring)', () => {
      const m = createSelectMachine({
        options: ['apple', 'banana', 'apricot'],
      })
      m.setQuery('ap')
      const filtered = m.getFilteredOptions()
      expect(filtered.map((o) => o.label)).toEqual(['apple', 'apricot'])
    })

    it('emits onSearch on query change', () => {
      const onSearch = vi.fn()
      const m = createSelectMachine({ options: ['a'], onSearch })
      m.setQuery('hello')
      expect(onSearch).toHaveBeenCalledWith('hello')
    })

    it('uses custom filter when provided', () => {
      const m = createSelectMachine<string>({
        options: ['apple', 'banana'],
        filter: ({ option }) => option.label === 'banana',
      })
      m.setQuery('x')
      expect(m.getFilteredOptions().map((o) => o.label)).toEqual(['banana'])
    })
  })

  describe('taggable', () => {
    it('creates from query', () => {
      const onCreate = vi.fn()
      const m = createSelectMachine({
        options: ['a'],
        taggable: true,
        onCreate,
      })
      m.setQuery('newtag')
      m.createFromQuery()
      expect(onCreate).toHaveBeenCalledWith('newtag')
    })

    it('showCreate is false when query matches an existing label', () => {
      const m = createSelectMachine({ options: ['hello'], taggable: true })
      m.setQuery('hello')
      expect(m.showCreate()).toBe(false)
    })
  })

  describe('keyboard', () => {
    it('Enter selects active option', () => {
      const onChange = vi.fn()
      const m = createSelectMachine({ options: ['a', 'b'], onChange })
      m.open()
      // open() puts active on index 0; Enter selects 'a'
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      m.handleSearchKeydown(event)
      expect(onChange).toHaveBeenCalledWith('a')
    })

    it('Escape closes', () => {
      const m = createSelectMachine({ options: ['a'] })
      m.open()
      m.handleSearchKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(m.getState().isOpen).toBe(false)
    })
  })

  describe('subscriptions', () => {
    it('notifies subscribers on state change', () => {
      const m = createSelectMachine({ options: ['a'] })
      const cb = vi.fn()
      const unsub = m.subscribe(cb)
      m.open()
      expect(cb).toHaveBeenCalled()
      unsub()
      cb.mockClear()
      m.close()
      expect(cb).not.toHaveBeenCalled()
    })
  })
})
