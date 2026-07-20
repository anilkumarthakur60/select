# @anil-labs/select-svelte

Svelte 5 adapter for [`@anil-labs/select`](https://github.com/anilkumarthakur60/vue3-select).

This adapter is **headless**: it ships no precompiled `.svelte` component. Doing
so would force both this package and its consumers onto `vite-plugin-svelte` and
pin a Svelte version into the tarball. Instead you get a small reactive wrapper
around the shared
[`@anil-labs/select-core`](https://github.com/anilkumarthakur60/vue3-select/tree/main/packages/core)
machine, which you compose into your own components.

## Install

```sh
npm install @anil-labs/select-svelte @anil-labs/select-core
```

## Usage

```svelte
<script lang="ts">
  import { createSelectAdapter, toSvelteProps } from '@anil-labs/select-svelte'
  import '@anil-labs/select-core/styles.css'

  const select = createSelectAdapter({
    options: ['apple', 'banana', 'cherry'],
    mode: 'multiple',
  })

  let tick = $state(0)
  $effect(() => select.subscribe(() => tick++))
</script>

<div {...toSvelteProps(select.machine.getRootProps())}>
  <input {...toSvelteProps(select.machine.getInputProps())} />
  {#if select.machine.getState().isOpen}
    <ul {...toSvelteProps(select.machine.getMenuProps())}>
      {#each select.machine.getFilteredOptions() as option, i}
        <li {...toSvelteProps(select.machine.getOptionProps(i))}>{option.label}</li>
      {/each}
    </ul>
  {/if}
</div>
```

`tick` is read inside the markup so Svelte re-renders on machine notifications —
runes cannot observe external pub/sub on their own.

`toSvelteProps` maps the core's Vue-JSX-style event keys (`onMousedown`) to
Svelte 5's lowercased ones (`onmousedown`).

## Styles

The stylesheet lives in `@anil-labs/select-core` so every adapter shares one
copy — importing it from this package will not work.

## License

MIT © [Er. Anil Kumar Thakur](https://github.com/anilkumarthakur60)
