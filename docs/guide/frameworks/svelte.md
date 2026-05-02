# Svelte 5

The Svelte adapter is **headless** — it ships `createSelectAdapter`, a
primitive that wraps the framework-agnostic state machine and exposes
`subscribe()` so you can bridge it into Svelte 5's runes. The npm package
deliberately doesn't ship a `.svelte` component because Svelte components
are compiled per-consumer; instead the playground includes a copy-paste
reference component you can drop into your project.

## Install

```bash
npm i @anilkumarthakur/select
```

`svelte ^5` is an optional peer dep.

## Import

```ts
import { createSelectAdapter, toSvelteProps } from '@anilkumarthakur/select/svelte'
import type { OptionLike, SelectMachineConfig } from '@anilkumarthakur/select/svelte'
import '@anilkumarthakur/select/style.css'
```

## Reactivity bridge

Svelte 5's reactivity is fine-grained — but the machine mutates internal
state that `$state` can't observe. The pattern: subscribe once, bump a
`tick` counter on every notify, and read `void tick` inside any
`$derived` that should re-run on machine state change.

```svelte
<script lang="ts" generics="T extends OptionLike = OptionLike">
  import { createSelectAdapter, toSvelteProps } from '@anilkumarthakur/select/svelte'
  import type { OptionLike, SelectMachineConfig } from '@anilkumarthakur/select/svelte'
  import { onMount } from 'svelte'

  let { ...config }: SelectMachineConfig<T> = $props()

  const adapter = createSelectAdapter<T>(config)

  let tick = $state(0)
  onMount(() => adapter.subscribe(() => (tick += 1)))

  // Re-push prop changes into the machine.
  $effect(() => adapter.machine.update(config))

  const state = $derived.by(() => { void tick; return adapter.machine.getState() })
  const filtered = $derived.by(() => { void tick; return adapter.machine.getFilteredOptions() })
  const selected = $derived.by(() => { void tick; return adapter.machine.getSelectedOptions() })
</script>

<div {...toSvelteProps(adapter.machine.getRootProps())}>
  <div {...toSvelteProps(adapter.machine.getControlProps())}>
    <input {...toSvelteProps(adapter.machine.getSearchProps())} />
  </div>
  <div {...toSvelteProps(adapter.machine.getMenuProps())}>
    {#each filtered as option, i (option.id)}
      <div {...toSvelteProps(adapter.machine.getOptionProps(option, i))}>
        {option.label}
      </div>
    {/each}
  </div>
</div>
```

`toSvelteProps` converts the core machine's React/Vue-style camelCase
event names (`onMousedown`, `onKeydown`) into the lowercase form
Svelte's templates expect (`onmousedown`, `onkeydown`).

## Reference component

A complete `Select.svelte` is included in the playground at
[`playground/svelte/Select.svelte`](https://github.com/anilkumarthakur60/vue3-select/blob/main/playground/svelte/Select.svelte).
Copy it into your project as a starting point.

## Limitations

- No tree-select component — use the Vue adapter or build on
  `useTreeSelection` from the core.
- No SSR-only build; `createSelectAdapter` is browser-only because the
  machine attaches DOM listeners on first read.

## What's next

- [Theming](../theming)
- [Composables API reference](/api/composables) — the underlying primitives
