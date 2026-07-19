import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import {
  createSelectMachine,
  type SelectMachine,
  type SelectMachineConfig,
} from '@anil-labs/select-core'
import type { OptionLike } from '@anil-labs/select-core'

/**
 * React hook that owns a select machine for the lifetime of the component.
 * Re-renders are driven by `useSyncExternalStore` reading from the machine's
 * subscribe/getState pair — no component-local state, no stale closures.
 *
 * Pass props each render; the hook diffs and `update()`s the machine. Pass
 * `modelValue` to run controlled, omit to run uncontrolled (the machine then
 * owns selection internally and surfaces it via `getSelectedOptions()`).
 */
export function useSelect<T extends OptionLike = OptionLike>(
  config: SelectMachineConfig<T>,
): SelectMachine<T> {
  // Build the machine exactly once; subsequent prop changes flow through
  // `update()`. Building in `useMemo` keeps it referentially stable for
  // useSyncExternalStore's subscribe identity.
  const machineRef = useRef<SelectMachine<T> | null>(null)
  if (machineRef.current === null) {
    machineRef.current = createSelectMachine<T>(config)
  }
  const machine = machineRef.current

  // Push every render's config into the machine. The machine compares
  // observable fields (options, modelValue, mode, disabled, loading) and
  // skips its notify() unless one actually changed — which means the
  // useSyncExternalStore re-render → useEffect → update() chain breaks
  // cleanly when nothing has happened, instead of looping forever.
  useEffect(() => {
    machine.update(config)
  })

  // The machine mutates its state in place, so returning state would have
  // a stable identity and useSyncExternalStore's Object.is bail-out would
  // skip every re-render. The version counter is a primitive that flips
  // on every notify(), giving useSyncExternalStore a fresh snapshot to
  // compare against on each subscriber callback.
  useSyncExternalStore(
    useMemo(() => (cb: () => void) => machine.subscribe(cb), [machine]),
    () => machine.getVersion(),
    () => machine.getVersion(),
  )

  return machine
}
