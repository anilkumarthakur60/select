# @anil-labs/select-solid

Solid adapter for [`@anil-labs/select`](https://github.com/anilkumarthakur60/select).

This adapter is **headless**: it ships no JSX component, just a primitive that
wires the shared
[`@anil-labs/select-core`](https://github.com/anilkumarthakur60/select/tree/main/packages/core)
machine to a Solid signal, so you build your own markup with full reactivity.

## Install

```sh
npm install @anil-labs/select-solid @anil-labs/select-core
```

## Usage

```tsx
import { createSelect, toSolidProps } from '@anil-labs/select-solid'
import '@anil-labs/select-core/styles.css'

function FruitPicker() {
  const select = createSelect({
    options: ['apple', 'banana', 'cherry'],
    mode: 'multiple',
  })

  return (
    <div {...toSolidProps(select.machine.getRootProps())}>
      {/* reading select.tick() subscribes this scope to machine updates */}
      <input {...toSolidProps(select.machine.getInputProps())} />
      <Show when={select.tick() >= 0 && select.machine.getState().isOpen}>
        <ul {...toSolidProps(select.machine.getMenuProps())}>
          <For each={select.machine.getFilteredOptions()}>
            {(option, i) => (
              <li {...toSolidProps(select.machine.getOptionProps(i()))}>{option.label}</li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  )
}
```

`select.tick()` must be read inside any reactive scope that should re-run when
the machine changes  the signal flips on every notification. Cleanup is
registered automatically via `onCleanup`.

`toSolidProps` maps the core's Vue-JSX-style event keys (`onMousedown`) to
Solid's lowercased ones (`onmousedown`).

## Not supported here

Tree select is Vue-only for now  use
[`@anil-labs/select-vue`](https://github.com/anilkumarthakur60/select/tree/main/packages/vue)
if you need hierarchical selection.

## Styles

The stylesheet lives in `@anil-labs/select-core` so every adapter shares one
copy  importing it from this package will not work.

## License

MIT © [Er. Anil Kumar Thakur](https://github.com/anilkumarthakur60)
