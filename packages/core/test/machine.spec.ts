import { describe, expect, it, vi } from 'vitest'
import { createSelectMachine } from '@/machine'

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

describe('createSelectMachine  regressions', () => {
  const key = (k: string) => {
    const event = { key: k, preventDefault: vi.fn(), stopPropagation: vi.fn() }
    return event as unknown as KeyboardEvent & { preventDefault: ReturnType<typeof vi.fn> }
  }

  describe('controlled modelValue', () => {
    // emitChange() wrote state.selectedValues but left config.modelValue stale,
    // and update() diffed against that stale value. A parent re-asserting the
    // value it last passed  rejecting a change, reverting a failed save,
    // resetting a form  saw "no change" and the machine kept its own
    // selection forever.
    it('reverts when the parent re-asserts the value it already had', () => {
      const m = createSelectMachine({ options: ['a', 'b', 'c'], mode: 'single', modelValue: 'a' })
      m.selectOption(m.getNormalizedOptions()[1]!)
      expect(m.getState().selectedValues).toEqual(['b'])

      m.update({ modelValue: 'a' })

      expect(m.getState().selectedValues).toEqual(['a'])
      expect(m.isSelected(m.getNormalizedOptions()[0]!)).toBe(true)
      expect(m.isSelected(m.getNormalizedOptions()[1]!)).toBe(false)
    })

    it('stays reverted across repeated re-asserts', () => {
      const m = createSelectMachine({ options: ['a', 'b'], mode: 'single', modelValue: 'a' })
      m.selectOption(m.getNormalizedOptions()[1]!)
      m.update({ modelValue: 'a' })
      m.update({ modelValue: 'a' })
      expect(m.getState().selectedValues).toEqual(['a'])
    })
  })

  describe('activeIndex reconciliation', () => {
    // The documented async pattern replaces `:options` on every response.
    it('re-resolves the highlight when options shrink under an open menu', () => {
      const m = createSelectMachine<string>({ options: ['a', 'b', 'c', 'd', 'e'] })
      m.open()
      m.moveActive(1)
      m.moveActive(1)
      expect(m.getState().activeIndex).toBe(2)

      m.update({ options: ['x', 'y'] })

      const { activeIndex } = m.getState()
      expect(activeIndex).toBeGreaterThanOrEqual(0)
      expect(activeIndex).toBeLessThan(m.getFilteredOptions().length)
      expect(m.getSearchProps()['aria-activedescendant']).toBeDefined()
    })

    it('Enter selects a real row after the list is replaced', () => {
      const onChange = vi.fn()
      const m = createSelectMachine<string>({ options: ['a', 'b', 'c', 'd', 'e'], onChange })
      m.open()
      m.moveActive(1)
      m.moveActive(1)
      m.update({ options: ['x', 'y'] })

      m.handleSearchKeydown(key('Enter'))

      expect(onChange).toHaveBeenCalledOnce()
    })

    // Enter used to preventDefault() purely because activeIndex >= 0, then
    // select nothing  swallowing the surrounding form's submit.
    it('does not swallow Enter when there is nothing to select', () => {
      const m = createSelectMachine({ options: [] })
      m.open()
      const event = key('Enter')
      m.handleSearchKeydown(event)
      expect(event.preventDefault).not.toHaveBeenCalled()
    })

    it('clears the highlight and notifies when every option is disabled', () => {
      const listener = vi.fn()
      const m = createSelectMachine({
        options: [
          { value: 'a', label: 'A', disabled: true },
          { value: 'b', label: 'B', disabled: true },
        ],
      })
      m.open()
      m.subscribe(listener)

      m.moveActive(1)

      expect(m.getState().activeIndex).toBe(-1)
      expect(listener).toHaveBeenCalled()
    })
  })

  describe('tags mode', () => {
    // showCreate() correctly reported "not creatable" for an exact match, but
    // the Enter handler never consulted it  so the user saw the real row,
    // pressed Enter, and got a duplicate tag instead of a selection.
    it('Enter on an exact match selects rather than creating a duplicate', () => {
      const onCreate = vi.fn()
      const onChange = vi.fn()
      const m = createSelectMachine({
        options: ['Vue', 'React'],
        mode: 'tags',
        onCreate,
        onChange,
      })
      m.open()
      m.setQuery('Vue')
      expect(m.showCreate()).toBe(false)

      m.handleSearchKeydown(key('Enter'))

      expect(onCreate).not.toHaveBeenCalled()
      expect(onChange).toHaveBeenCalledOnce()
    })

    it('treats a whitespace-only query as not creatable', () => {
      const onCreate = vi.fn()
      const m = createSelectMachine({ options: ['Vue'], mode: 'tags', onCreate })
      m.open()
      m.setQuery('   ')

      expect(m.showCreate()).toBe(false)
      m.handleSearchKeydown(key('Enter'))
      expect(onCreate).not.toHaveBeenCalled()
    })

    it('creates the trimmed query, not the raw one', () => {
      const onCreate = vi.fn()
      const m = createSelectMachine({ options: ['Vue'], mode: 'tags', onCreate })
      m.open()
      m.setQuery('  Svelte  ')
      m.handleSearchKeydown(key('Enter'))
      expect(onCreate).toHaveBeenCalledWith('Svelte')
    })
  })

  describe('empty-string option value', () => {
    // toArray() maps '' to []  right for an incoming modelValue, wrong on the
    // emit path. '' is the native-<select> "any / no preference" sentinel, so
    // the control emitted onChange('') and then rendered as though nothing
    // were chosen. Multiple mode already behaved correctly.
    it('records a selection whose value is the empty string', () => {
      const onChange = vi.fn()
      const m = createSelectMachine({
        options: [
          { value: '', label: 'Any' },
          { value: 'a', label: 'Alpha' },
        ],
        mode: 'single',
        onChange,
      })
      const any = m.getNormalizedOptions()[0]!

      m.selectOption(any)

      expect(onChange).toHaveBeenCalledWith('')
      expect(m.getState().selectedValues).toEqual([''])
      expect(m.isSelected(any)).toBe(true)
      expect(m.hasSelection()).toBe(true)
      expect(m.getOptionProps(any, 0)['aria-selected']).toBe(true)
    })

    it('still treats an incoming empty-string modelValue as "nothing selected"', () => {
      const m = createSelectMachine({ options: ['a'], mode: 'single', modelValue: '' })
      expect(m.getState().selectedValues).toEqual([])
      expect(m.hasSelection()).toBe(false)
    })
  })

  describe('NaN-valued options', () => {
    it('deselects on the second click and fires onDeselect once', () => {
      const onDeselect = vi.fn()
      const m = createSelectMachine({
        options: [{ value: NaN, label: 'N/A' }],
        mode: 'multiple',
        onDeselect,
      })
      const option = m.getNormalizedOptions()[0]!

      m.selectOption(option)
      m.selectOption(option)

      expect(m.getState().selectedValues).toEqual([])
      expect(m.isSelected(option)).toBe(false)
      expect(onDeselect).toHaveBeenCalledOnce()
    })
  })

  describe('selected options not present in `options`', () => {
    it('keeps the label of a value whose option was removed', () => {
      const users = [
        { id: 'u_8f21c', name: 'Ada Lovelace' },
        { id: 'u_31bb0', name: 'Grace Hopper' },
      ]
      const m = createSelectMachine({
        options: users,
        mode: 'single',
        optionValue: 'id',
        optionLabel: 'name',
      })
      m.selectOption(m.getNormalizedOptions()[0]!)

      // docs/guide/async.md empties `results` whenever the query clears  which
      // used to turn the chosen name back into the raw database id on screen.
      m.update({ options: [] })

      expect(m.getSelectedOptions()[0]?.label).toBe('Ada Lovelace')
    })

    it('gives synthetic options unique ids', () => {
      // Ids were derived from the label, so every value that resolved to an
      // empty label collided on `synthetic-` and React logged duplicate keys.
      const m = createSelectMachine({
        options: [{ label: 'Alpha', value: { id: 1 } }],
        mode: 'multiple',
        modelValue: [{ id: 7 }, { id: 8 }],
      })
      const selected = m.getSelectedOptions()
      expect(selected).toHaveLength(2)
      expect(selected[0]?.id).not.toBe(selected[1]?.id)
    })

    it('resolves a synthetic label through the configured optionLabel', () => {
      const m = createSelectMachine({
        options: [],
        mode: 'multiple',
        optionLabel: 'title',
        modelValue: [{ id: 1, title: 'United States' }],
      })
      expect(m.getSelectedOptions()[0]?.label).toBe('United States')
    })
  })
})
