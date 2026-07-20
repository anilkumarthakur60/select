/** @jsxImportSource react */
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { useSelect } from '@/useSelect'
import {
  toReactRootProps,
  toReactControlProps,
  toReactSearchProps,
  toReactMenuProps,
  toReactOptionProps,
  toReactClearProps,
} from '@/dom-props'
import type { SelectMachineConfig } from '@anil-labs/select-core'
import type { NormalizedOption, OptionLike } from '@anil-labs/select-core'

export interface SelectProps<T extends OptionLike = OptionLike> extends SelectMachineConfig<T> {
  className?: string
  style?: CSSProperties
  /** Render a single selected value (single mode). */
  renderValue?: (option: NormalizedOption<T>) => ReactNode
  /** Render a tag (multi/tags mode). */
  renderTag?: (option: NormalizedOption<T>, remove: () => void) => ReactNode
  /** Render an option row. */
  renderOption?: (option: NormalizedOption<T>, isActive: boolean, isSelected: boolean) => ReactNode
}

/**
 * Default React `<Select>` — built on top of `useSelect`. Most consumers will
 * use this; those wanting custom DOM should use `useSelect` directly and
 * spread the prop bags onto their own elements.
 */
export function Select<T extends OptionLike = OptionLike>(props: SelectProps<T>): ReactNode {
  const { className, style, renderValue, renderTag, renderOption, ...config } = props
  const machine = useSelect<T>(config)

  const searchRef = useRef<HTMLInputElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const state = machine.getState()
  const filtered = machine.getFilteredOptions()
  const selected = machine.getSelectedOptions()
  const isMulti = machine.isMulti()

  // Outside-click handler. Closes the menu when the user clicks anywhere
  // outside both the root (control) and the menu.
  useEffect(() => {
    if (!state.isOpen) return
    function onDown(event: MouseEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      machine.close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [state.isOpen, machine])

  // Auto-focus the search input on open.
  useEffect(() => {
    if (state.isOpen && config.searchable !== false) {
      searchRef.current?.focus()
    }
  }, [state.isOpen, config.searchable])

  const rootProps = toReactRootProps(machine.getRootProps())
  const controlProps = toReactControlProps(machine.getControlProps())
  const searchProps = toReactSearchProps(machine.getSearchProps())
  const menuProps = toReactMenuProps(machine.getMenuProps())
  const clearProps = toReactClearProps(machine.getClearButtonProps())

  return (
    <div
      ref={rootRef}
      {...rootProps}
      className={[rootProps.className, className].filter(Boolean).join(' ')}
      style={style}
    >
      <div {...controlProps} className="vselect-control">
        <div className="vselect-values">
          {!isMulti && selected[0] && !state.query ? (
            renderValue ? (
              renderValue(selected[0])
            ) : (
              <span className="vselect-single">{selected[0].label}</span>
            )
          ) : null}

          {isMulti && selected.length > 0 ? (
            <>
              {selected.map((option) =>
                renderTag ? (
                  <span key={option.id}>
                    {renderTag(option, () => machine.deselectOption(option))}
                  </span>
                ) : (
                  <span key={option.id} className="vselect-tag">
                    <span className="vselect-tag-label">{option.label}</span>
                    <button
                      type="button"
                      className="vselect-tag-remove"
                      aria-label={`Remove ${option.label}`}
                      tabIndex={-1}
                      onMouseDown={(event) => {
                        event.preventDefault()
                        machine.deselectOption(option)
                      }}
                    >
                      ×
                    </button>
                  </span>
                ),
              )}
            </>
          ) : null}

          {!machine.hasSelection() && !state.query && config.searchable === false ? (
            <span className="vselect-placeholder">{config.placeholder ?? 'Select…'}</span>
          ) : null}

          {config.searchable !== false ? (
            <input
              ref={searchRef}
              {...searchProps}
              className={[
                'vselect-search',
                !isMulti && machine.hasSelection() && !state.query ? 'is-hidden' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          ) : null}
        </div>

        <div className="vselect-indicators">
          {config.loading ? (
            <span className="vselect-spinner" aria-hidden="true" />
          ) : config.clearable !== false && machine.hasSelection() && !config.disabled ? (
            <button {...clearProps} className="vselect-indicator">
              ×
            </button>
          ) : null}
          <span className="vselect-indicator" aria-hidden="true">
            ▾
          </span>
        </div>
      </div>

      <div ref={menuRef} {...menuProps} className="vselect-menu">
        {config.loading ? (
          <div className="vselect-loading">
            <span className="vselect-spinner" />
            <span>{config.loadingText ?? 'Loading…'}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="vselect-empty">{machine.emptyMessage()}</div>
        ) : (
          filtered.map((option, index) => {
            const optionProps = toReactOptionProps(machine.getOptionProps(option, index))
            return (
              <div key={option.id} {...optionProps}>
                {renderOption ? (
                  renderOption(option, state.activeIndex === index, machine.isSelected(option))
                ) : (
                  <span>{option.label}</span>
                )}
              </div>
            )
          })
        )}

        {machine.showCreate() ? (
          <div
            className="vselect-create"
            role="option"
            aria-selected={false}
            onMouseDown={(event) => {
              event.preventDefault()
              machine.createFromQuery()
            }}
          >
            Create <strong>{state.query}</strong>
          </div>
        ) : null}
      </div>
    </div>
  )
}
