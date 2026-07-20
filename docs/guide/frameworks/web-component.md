# Web Components

The Web Component adapter registers a `<a-select>` custom element and
covers every framework that doesn't get a dedicated package — Angular,
Lit, Alpine, Astro, Qwik, vanilla JS, server-rendered HTML.

## Install

```bash
npm i @anil-labs/select-core
```

No peer dependencies. The element extends `HTMLElement` directly.

## Import

```ts
import { defineSelectElement } from '@anil-labs/select-element'
import '@anil-labs/select-core/styles.css'

defineSelectElement('a-select') // tag name is configurable; default is 'a-select'
```

`defineSelectElement` is idempotent — calling it twice with the same tag
name is a no-op.

## Markup

```html
<a-select id="picker" placeholder="Pick a fruit"></a-select>

<script type="module">
  const el = document.getElementById('picker')

  // Object/array values must go through the property setter, not an attribute.
  el.options = ['Apple', 'Banana', 'Cherry']
  el.value = 'Apple'

  el.addEventListener('change', (e) => {
    console.log('selected:', e.detail)
  })
</script>
```

## Attributes

| Attribute                                       | Values                           | Purpose                                    |
| ----------------------------------------------- | -------------------------------- | ------------------------------------------ |
| `mode`                                          | `single` \| `multiple` \| `tags` | Selection shape                            |
| `placeholder`                                   | string                           | Placeholder text                           |
| `disabled`                                      | boolean                          | Disable interaction                        |
| `loading`                                       | boolean                          | Show spinner                               |
| `taggable`                                      | boolean                          | Allow create-on-Enter (with `mode="tags"`) |
| `size`                                          | `sm` \| `md` \| `lg`             | Trigger size                               |
| `theme`                                         | `light` \| `dark` \| `auto`      | Theme override                             |
| `aria-label`                                    | string                           | Accessible label                           |
| `empty-text`, `no-results-text`, `loading-text` | string                           | Status copy                                |
| `no-search`                                     | boolean                          | Hide the search input                      |
| `no-clear`                                      | boolean                          | Hide the clear button                      |

Setting `options` (`OptionLike[]`) and `value` (any) **must** go through
the JS property — attributes only carry strings.

## Events

All emitted as `CustomEvent` on the element:

| Event           | `event.detail`                               |
| --------------- | -------------------------------------------- |
| `change`        | The new value (single, array, or `null`)     |
| `select`        | The just-selected option                     |
| `deselect`      | The just-removed option                      |
| `create`        | The string the user just created (tags mode) |
| `search`        | The current query string                     |
| `open`, `close` | _(no detail)_                                |

## Limitations

- **No tree-select.** Use the Vue adapter for hierarchical selection.
- **No shadow DOM.** Consumer styles apply directly — by design, so the
  shared `style.css` works without `::part` plumbing.
- **No internal slots.** Render-customisation is attribute-driven; for
  custom option markup, use a framework adapter instead.

## SSR safety

The module is import-safe in Node (Astro, Nuxt SSR, Next.js). The class
falls back to a no-op base when `HTMLElement` is undefined, so server
rendering won't crash. Actual element behaviour still requires a browser
or jsdom runtime — call `defineSelectElement` from a client-only entry.

## What's next

- [Theming](../theming) — CSS custom properties shared with every adapter
- [Composables API reference](/api/composables) — the same machine, headless
