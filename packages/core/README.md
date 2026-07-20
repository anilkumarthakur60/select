# @anil-labs/select-core

Framework-agnostic state machine, option normalisation and styles behind
[`@anil-labs/select`](https://github.com/anilkumarthakur60/select). No
framework dependency — this is the package every adapter is built on.

Reach for it directly when you are writing your own adapter, or driving a select
from a framework that has no published adapter yet.

## Install

```sh
npm install @anil-labs/select-core
```

## Usage

```ts
import { createSelectMachine } from '@anil-labs/select-core'

const machine = createSelectMachine({
  options: ['apple', 'banana', 'cherry'],
  mode: 'single',
  onChange: (value) => console.log(value),
})

const unsubscribe = machine.subscribe(() => render())

machine.open()
machine.setActiveIndex(1)
machine.selectActive()
```

The machine owns all behaviour — open/close, keyboard navigation, filtering,
single/multiple/tags modes, and the ARIA attribute bags. An adapter's job is
only to bind those bags to the host framework's DOM and re-render on notify.

### Prop bags

`getRootProps()`, `getControlProps()`, `getInputProps()`, `getMenuProps()` and
`getOptionProps(index)` each return a plain object of attributes and handlers.
Event keys use Vue-JSX-style camelCase (`onMousedown`); adapters for frameworks
that expect a different casing translate them (see `toSolidProps` /
`toSvelteProps`).

## Styles

The stylesheet ships here, not in the adapters, so a single copy is shared:

```ts
import '@anil-labs/select-core/styles.css'
```

Source Sass is exported too, if you want to override variables before
compiling:

```scss
@use '@anil-labs/select-core/scss/index' with (
  $vselect-border-radius: 8px
);
```

## Also exported

`normalize`, `normalizeTree`, `walkTree`, `filterTree`, `flattenTree`,
`defaultFilter`, `escapeRegex`, `valuesEqual`, `toggleValue`, `readAccessor`,
`getAncestorIds`, `getLeafValues`, plus the full type surface.

## Adapters

| Package                                                                                               | Framework      |
| ----------------------------------------------------------------------------------------------------- | -------------- |
| [`@anil-labs/select-vue`](https://github.com/anilkumarthakur60/select/tree/main/packages/vue)         | Vue 3 / Nuxt   |
| [`@anil-labs/select-react`](https://github.com/anilkumarthakur60/select/tree/main/packages/react)     | React          |
| [`@anil-labs/select-svelte`](https://github.com/anilkumarthakur60/select/tree/main/packages/svelte)   | Svelte 5       |
| [`@anil-labs/select-solid`](https://github.com/anilkumarthakur60/select/tree/main/packages/solid)     | Solid          |
| [`@anil-labs/select-element`](https://github.com/anilkumarthakur60/select/tree/main/packages/element) | Web Components |

## License

MIT © [Er. Anil Kumar Thakur](https://github.com/anilkumarthakur60)
