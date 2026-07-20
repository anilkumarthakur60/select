import {
  createSelectMachine,
  type SelectMachine,
  type SelectMachineConfig,
} from '@anil-labs/select-core'
import type { OptionLike } from '@anil-labs/select-core'

// Svelte 5 adapter is *headless*: no precompiled `.svelte` component ships
// from this package. That would force consumers (and our own build) onto
// vite-plugin-svelte, plus pin a Svelte version into the tarball. Instead
// we expose a small reactive store wrapper consumers compose into their own
// .svelte files with $state / $derived.
//
// Usage inside a consumer's <script>:
//
//   const select = createSelectAdapter({ options, mode: 'multiple' })
//   $effect(() => {
//     const unsub = select.subscribe(() => select.tick++)
//     return unsub
//   })
//
// Then in markup, drive props off `select.machine.getRootProps()` etc.

export interface SvelteSelectAdapter<T extends OptionLike = OptionLike> {
  machine: SelectMachine<T>
  subscribe: (listener: () => void) => () => void
  /**
   * Manual tick counter — increment inside an effect to force a Svelte
   * `$state` re-read when the machine notifies. Svelte 5 runes can't observe
   * external pub/sub on their own.
   */
  tick: number
}

export function createSelectAdapter<T extends OptionLike = OptionLike>(
  config: SelectMachineConfig<T>,
): SvelteSelectAdapter<T> {
  const machine = createSelectMachine<T>(config)
  return {
    machine,
    // Refuted during the audit: `createSelectMachine` returns an object literal
    // of closures over its factory scope, so `subscribe` never reads `this` and
    // detaching it is safe. The rule flags the shape, not an actual defect.
    //
    // Directive stays on the line directly above its target — Prettier reflows
    // a long trailing `--` reason and would move it off.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    subscribe: machine.subscribe,
    tick: 0,
  }
}

/**
 * Translate the core's Vue-JSX-style event keys into Svelte 5's lowercased
 * keys (`onmousedown`, `onkeydown`, …). Spread the result onto an element:
 *
 *   <div {...toSvelteProps(machine.getRootProps())}>
 */
// Generic over `object`, not `Record<string, unknown>`: the machine's prop bags
// are interfaces, which have no implicit index signature and so are not
// assignable to `Record<string, unknown>`. The usage documented just above
// would not have typechecked otherwise.
export function toSvelteProps<T extends object>(props: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && key.length > 2 && key[2] === key[2]?.toUpperCase()) {
      out[key.toLowerCase()] = value
    } else if (key === 'class') {
      out.class = value
    } else if (key === 'tabindex') {
      out.tabindex = value
    } else {
      out[key] = value
    }
  }
  return out
}
