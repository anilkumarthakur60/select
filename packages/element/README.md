# @anil-labs/select-element

`<a-select>` custom element for
[`@anil-labs/select`](https://github.com/anilkumarthakur60/select)  a
framework-free select you can drop into any page, built on the shared
[`@anil-labs/select-core`](https://github.com/anilkumarthakur60/select/tree/main/packages/core)
state machine.

## Install

```sh
npm install @anil-labs/select-element @anil-labs/select-core
```

## Usage

```ts
import { defineSelectElement } from '@anil-labs/select-element'
import '@anil-labs/select-core/styles.css'

defineSelectElement() // registers <a-select>
```

```html
<a-select placeholder="Pick a fruit" mode="single"></a-select>

<script type="module">
  const el = document.querySelector('a-select')
  el.options = ['apple', 'banana', 'cherry']
  el.addEventListener('change', (e) => console.log(e.detail))
</script>
```

Pass a different tag name to register under your own prefix:

```ts
defineSelectElement('my-select')
```

## Attributes

`mode`, `placeholder`, `disabled`, `loading`, `searchable`, `clearable`,
`taggable`, `aria-label`, `size`, `theme`, `empty-text`, `no-results-text`,
`loading-text`.

## Properties

`options` and the other config values are set as JS properties rather than
attributes, since they hold non-string data. Assigning to them re-pushes config
into the machine and re-renders.

## Styles

The stylesheet lives in `@anil-labs/select-core` so every adapter shares one
copy  importing it from this package will not work.

## License

MIT © [Er. Anil Kumar Thakur](https://github.com/anilkumarthakur60)
