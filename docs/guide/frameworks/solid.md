# Solid

The Solid adapter is **headless** — it ships `createSelect`, a primitive
that wraps the framework-agnostic state machine and exposes a `tick`
accessor so Solid's fine-grained reactivity can subscribe to machine
notifications. No JSX component is shipped; consumers wire their own DOM
in their `.tsx`.

## Install

```bash
npm i @anil-labs/select-core
```

`solid-js ^1.8` is an optional peer dep.

## Import

```ts
import { createSelect, toSolidProps } from '@anil-labs/select-solid'
import type { OptionLike, SelectMachineConfig } from '@anil-labs/select-solid'
import '@anil-labs/select-core/styles.css'
```

## Reactivity bridge

`createSelect` returns the underlying `machine` plus a `tick` accessor.
Read `tick()` inside any `createMemo` / `createEffect` that should re-run
when the machine notifies. The signal flips on every notify.

```tsx
import { createMemo, For, Show } from 'solid-js'
import { createSelect, toSolidProps } from '@anil-labs/select-solid'

export default function Select<T>(props: SelectMachineConfig<T>) {
  const select = createSelect<T>(props)

  // Push prop changes into the machine.
  createEffect(() => select.machine.update(props))

  // All these read `tick()` so they re-evaluate on every notify.
  const state = createMemo(() => (select.tick(), select.machine.getState()))
  const filtered = createMemo(() => (select.tick(), select.machine.getFilteredOptions()))
  const selected = createMemo(() => (select.tick(), select.machine.getSelectedOptions()))

  return (
    <div {...toSolidProps(select.machine.getRootProps())}>
      <div {...toSolidProps(select.machine.getControlProps())}>
        <input {...toSolidProps(select.machine.getSearchProps())} />
      </div>
      <div {...toSolidProps(select.machine.getMenuProps())}>
        <For each={filtered()}>
          {(option, i) => (
            <div {...toSolidProps(select.machine.getOptionProps(option, i()))}>{option.label}</div>
          )}
        </For>
      </div>
    </div>
  )
}
```

`toSolidProps` lowercases the core machine's camelCase event names
(`onMousedown` → `onmousedown`) so they match Solid's JSX runtime.

## Reference component

A complete `Select.tsx` is included in the playground at
[`playground/solid/Select.tsx`](https://github.com/anilkumarthakur60/select/blob/main/playground/solid/Select.tsx).
Copy it into your project as a starting point.

## Limitations

- Tree-select is not supported. Use the Vue adapter for hierarchical
  selection.
- The signal pattern (`tick()`) is the only way to subscribe — Solid
  cannot observe arbitrary class mutations on its own.

## What's next

- [Theming](../theming)
- [Composables API reference](/api/composables) — the underlying primitives
