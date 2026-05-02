import { createEffect, createMemo, For, onCleanup, Show, type JSX } from 'solid-js'
import { createSelect, toSolidProps } from '@/solid'
import type {
  NormalizedOption,
  OptionLike,
  SelectMachineConfig,
} from '@/solid'

// Idiomatic Solid Select component built on the headless `createSelect`
// primitive. Solid's reactivity is fine-grained — wrapping every machine
// read in a `createMemo` keeps the JSX subscribed via `select.tick()`.
//
// This file ships with the playground as a copy-paste reference; the npm
// package itself stays headless so consumers can wire their own DOM.

export interface SolidSelectProps<T extends OptionLike = OptionLike>
  extends SelectMachineConfig<T> {
  class?: string
  renderOption?: (option: NormalizedOption<T>, isActive: boolean, isSelected: boolean) => JSX.Element
  renderValue?: (option: NormalizedOption<T>) => JSX.Element
}

export default function Select<T extends OptionLike = OptionLike>(
  props: SolidSelectProps<T>,
): JSX.Element {
  const select = createSelect<T>(props as SelectMachineConfig<T>)

  // Push every prop change into the machine. Solid re-runs the effect on
  // any reactive read inside, and `props` is reactive.
  createEffect(() => {
    select.machine.update(props as SelectMachineConfig<T>)
  })

  // All these read `select.tick()` so they re-evaluate on every notify.
  const state = createMemo(() => (select.tick(), select.machine.getState()))
  const filtered = createMemo(() => (select.tick(), select.machine.getFilteredOptions()))
  const selected = createMemo(() => (select.tick(), select.machine.getSelectedOptions()))
  const isMulti = createMemo(() => (select.tick(), select.machine.isMulti()))
  const hasSelection = createMemo(() => (select.tick(), select.machine.hasSelection()))

  let rootEl: HTMLDivElement | undefined
  let menuEl: HTMLDivElement | undefined
  let searchEl: HTMLInputElement | undefined

  // Outside-click closes the menu.
  createEffect(() => {
    if (!state().isOpen) return
    function onDown(event: MouseEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (rootEl?.contains(target)) return
      if (menuEl?.contains(target)) return
      select.machine.close()
    }
    document.addEventListener('mousedown', onDown)
    onCleanup(() => document.removeEventListener('mousedown', onDown))
  })

  // Auto-focus the search on open.
  createEffect(() => {
    if (state().isOpen && props.searchable !== false) {
      queueMicrotask(() => searchEl?.focus())
    }
  })

  return (
    <div ref={rootEl} {...toSolidProps(select.machine.getRootProps())}>
      <div class="vselect-control" {...toSolidProps(select.machine.getControlProps())}>
        <div class="vselect-values">
          <Show when={!isMulti() && selected()[0] && !state().query}>
            {props.renderValue ? (
              props.renderValue(selected()[0]!)
            ) : (
              <span class="vselect-single">{selected()[0]!.label}</span>
            )}
          </Show>

          <Show when={isMulti()}>
            <For each={selected()}>
              {(option) => (
                <span class="vselect-tag">
                  <span class="vselect-tag-label">{option.label}</span>
                  <button
                    type="button"
                    class="vselect-tag-remove"
                    aria-label={`Remove ${option.label}`}
                    tabindex={-1}
                    onmousedown={(event) => {
                      event.preventDefault()
                      select.machine.deselectOption(option)
                    }}
                  >
                    ×
                  </button>
                </span>
              )}
            </For>
          </Show>

          <Show when={props.searchable !== false}>
            <input
              ref={searchEl}
              {...toSolidProps(select.machine.getSearchProps())}
              class={['vselect-search', !isMulti() && hasSelection() && !state().query ? 'is-hidden' : '']
                .filter(Boolean)
                .join(' ')}
            />
          </Show>
        </div>

        <div class="vselect-indicators">
          <Show
            when={props.loading}
            fallback={
              <Show when={props.clearable !== false && hasSelection() && !props.disabled}>
                <button
                  {...toSolidProps(select.machine.getClearButtonProps())}
                  class="vselect-indicator"
                >
                  ×
                </button>
              </Show>
            }
          >
            <span class="vselect-spinner" aria-hidden="true" />
          </Show>
          <span class="vselect-indicator" aria-hidden="true">▾</span>
        </div>
      </div>

      <div ref={menuEl} {...toSolidProps(select.machine.getMenuProps())} class="vselect-menu">
        <Show
          when={!props.loading}
          fallback={
            <div class="vselect-loading">
              <span class="vselect-spinner" />
              <span>{props.loadingText ?? 'Loading…'}</span>
            </div>
          }
        >
          <Show
            when={filtered().length > 0}
            fallback={<div class="vselect-empty">{select.machine.emptyMessage()}</div>}
          >
            <For each={filtered()}>
              {(option, index) => {
                const optProps = createMemo(() =>
                  (select.tick(), toSolidProps(select.machine.getOptionProps(option, index()))),
                )
                return (
                  <div {...optProps()}>
                    {props.renderOption
                      ? props.renderOption(
                          option,
                          state().activeIndex === index(),
                          select.machine.isSelected(option),
                        )
                      : <span>{option.label}</span>}
                  </div>
                )
              }}
            </For>
          </Show>
        </Show>

        <Show when={(select.tick(), select.machine.showCreate())}>
          <div
            class="vselect-create"
            role="option"
            aria-selected={false}
            tabindex={-1}
            onmousedown={(event) => {
              event.preventDefault()
              select.machine.createFromQuery()
            }}
          >
            Create <strong>{state().query}</strong>
          </div>
        </Show>
      </div>
    </div>
  )
}
