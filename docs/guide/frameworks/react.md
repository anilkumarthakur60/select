# React

The React adapter ships an idiomatic `<Select>` component and a
`useSelect` hook on top of the same framework-agnostic state machine the
Vue adapter uses.

## Install

```bash
npm i @anilkumarthakur/select
```

`react ^18 || ^19` and `react-dom ^18 || ^19` are optional peer deps.

## Import

```ts
import { Select, useSelect } from '@anilkumarthakur/select/react'
import '@anilkumarthakur/select/style.css'
```

## Component usage

`<Select>` is **controlled by default** via `modelValue` + `onChange`:

```tsx
import { useState } from 'react'
import { Select } from '@anilkumarthakur/select/react'

export function FruitPicker() {
  const [fruit, setFruit] = useState<string | null>(null)
  return (
    <Select
      modelValue={fruit}
      options={['Apple', 'Banana', 'Cherry']}
      placeholder="Pick a fruit"
      onChange={(v) => setFruit(v as string | null)}
    />
  )
}
```

### Object options & accessors

```tsx
interface Country { code: string; name: string }
const countries: Country[] = [/* … */]

const [selected, setSelected] = useState<string[]>([])

<Select<Country>
  mode="multiple"
  modelValue={selected}
  options={countries}
  optionValue="code"
  optionLabel="name"
  placeholder="Pick countries"
  onChange={(v) => setSelected(v as string[])}
/>
```

The component is generic over `T` — `optionValue` / `optionLabel` are
type-checked against `keyof T`.

## Hook usage (headless)

If you'd rather render your own DOM, drop down to `useSelect`:

```tsx
import { useSelect, toReactRootProps, toReactControlProps, toReactMenuProps,
         toReactSearchProps, toReactOptionProps } from '@anilkumarthakur/select/react'

export function CommandPalette() {
  const select = useSelect({
    options: ['Apple', 'Banana', 'Cherry'],
    mode: 'single',
  })

  return (
    <div {...toReactRootProps(select.machine.getRootProps())}>
      <div {...toReactControlProps(select.machine.getControlProps())}>
        <input {...toReactSearchProps(select.machine.getSearchProps())} />
      </div>
      <ul {...toReactMenuProps(select.machine.getMenuProps())}>
        {select.machine.getFilteredOptions().map((option, i) => (
          <li key={option.id} {...toReactOptionProps(select.machine.getOptionProps(option, i))}>
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

The `toReact*Props` helpers translate the core machine's prop shapes
(camelCase event names, `class` → `className`) into ones React's JSX
runtime accepts.

## Limitations

- Tree-select is not yet shipped as a React component. The state model
  exists in the core (`createSelectMachine`), but render-side parity with
  `<VTreeSelect>` is Vue-only for now.

## What's next

- [Headless Composables](../headless) — same primitives, framework-agnostic
- [Theming](../theming) — CSS custom properties shared across adapters
- [Composables API reference](/api/composables) — every primitive's signature
