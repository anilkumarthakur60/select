# @anil-labs/select-react

React bindings for [`@anil-labs/select`](https://github.com/anilkumarthakur60/select) 
a ready-made `<Select>` plus the `useSelect` hook it is built on, both driven by
the shared
[`@anil-labs/select-core`](https://github.com/anilkumarthakur60/select/tree/main/packages/core)
state machine.

## Install

```sh
npm install @anil-labs/select-react @anil-labs/select-core
```

## Usage

```tsx
import { useState } from 'react'
import { Select } from '@anil-labs/select-react'
import '@anil-labs/select-core/styles.css'

export function FruitPicker() {
  const [value, setValue] = useState<string | null>(null)

  return (
    <Select
      options={['apple', 'banana', 'cherry']}
      modelValue={value}
      onChange={setValue}
      placeholder="Pick a fruit"
    />
  )
}
```

The stylesheet lives in `@anil-labs/select-core` so every adapter shares one
copy  importing it from this package will not work.

### Custom rendering

`<Select>` takes render props for the three variable surfaces, so you can keep
its behaviour and replace its markup:

```tsx
<Select
  options={users}
  optionLabel="name"
  optionValue="id"
  renderOption={(option, isActive, isSelected) => (
    <span className={isActive ? 'active' : undefined}>
      {option.label} {isSelected && '✓'}
    </span>
  )}
/>
```

### Full control with `useSelect`

When you want your own DOM entirely, use the hook and spread the prop bags:

```tsx
const machine = useSelect({ options, mode: 'multiple' })

<div {...toReactRootProps(machine.getRootProps())}>
  <input {...toReactSearchProps(machine.getInputProps())} />
</div>
```

The `toReact*Props` helpers translate the core's Vue-JSX-style event keys
(`onMousedown`) into React's (`onMouseDown`).

## License

MIT © [Er. Anil Kumar Thakur](https://github.com/anilkumarthakur60)
