import { createSignal, onCleanup, type Accessor } from 'solid-js'
import { createSelectMachine, type SelectMachine, type SelectMachineConfig } from '@/core/machine'
import type { OptionLike } from '@/core/types/option'

// Solid adapter is *headless*: no JSX component shipped, just a primitive
// that wires the framework-agnostic machine to a Solid signal so consumers
// get reactivity in their own `.tsx`. Tree-select is not supported here —
// use the Vue adapter for hierarchical selection.
//
// Usage:
//
//   const select = createSelect({ options, mode: 'multiple' })
//   <div {...toSolidProps(select.machine.getRootProps())}>...</div>
//
// `select.tick()` is read inside any reactive scope that should re-run on
// machine state change — derived signals, effects, JSX. The signal flips
// on every `subscribe` notification.

export interface SolidSelect<T extends OptionLike = OptionLike> {
  machine: SelectMachine<T>
  /** Read inside a reactive scope to subscribe to machine notifications. */
  tick: Accessor<number>
}

export function createSelect<T extends OptionLike = OptionLike>(
  config: SelectMachineConfig<T>,
): SolidSelect<T> {
  const machine = createSelectMachine<T>(config)
  const [tick, setTick] = createSignal(0)
  const unsub = machine.subscribe(() => setTick((n) => n + 1))
  onCleanup(unsub)
  return { machine, tick }
}

/**
 * Solid uses lowercased event names (`onmousedown`, `onkeydown`). The core
 * machine emits Vue-JSX-style camelCase (`onMousedown`); this maps between
 * them. Spread the result onto an element.
 */
export function toSolidProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && key.length > 2 && key[2] === key[2]?.toUpperCase()) {
      out[key.toLowerCase()] = value
    } else {
      out[key] = value
    }
  }
  return out
}

export * from '@/core'
