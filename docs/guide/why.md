# Why @anilkumarthakur/vue3-select?

There are plenty of select components for Vue. This one earns its place by
sweating the parts that other libraries leave fuzzy.

## One component, every shape

Single, multi, tags (with create-on-Enter), grouped, async, and tree — same
props surface, same slot names, same keyboard map. You don't switch
component imports when the design changes.

```vue
<VSelect v-model="x" mode="single" :options="..." />
<VSelect v-model="x" mode="multiple" :options="..." />
<VSelect v-model="x" mode="tags" :options="..." taggable />
<VTreeSelect v-model="x" :options="..." />
```

## Typed against your data

Generic over `T`. Accessors are `keyof T | (o: T) => …`, so the compiler
catches `option-value="cod"` typos and infers slot props correctly:

```vue
<VSelect
  v-model="country"
  :options="countries"
  option-value="code"  // <-- ✅ keyof Country
  option-label="name"  // <-- ✅ keyof Country
/>
```

## Accessibility you can trust

- WAI-ARIA 1.2 combobox + listbox / treeitem patterns
- `aria-activedescendant` updates as the user navigates
- Full keyboard support: ↑ / ↓ / Home / End / Enter / Esc / Tab / Backspace
- Focus survives menu open / close, tag removal, async option swaps
- `prefers-reduced-motion` honored

## Headless when you need it

Every state machine inside the SFCs is also exported as a standalone
composable. Want a custom command-palette UI? Reuse `useSelection`,
`useMenuState`, `useOptionFilter`, `useKeyboardNav`, and skip the bundled
chrome.

```ts
import {
  useSelection,
  useMenuState,
  useOptionFilter,
  useKeyboardNav,
  useDebounced,
  useTaggable,
  useTriggerInteractions,
  useFloatingMenu,
  useOutsideClick,
  useControlFocus,
  useFormBinding,
} from '@anilkumarthakur/vue3-select'
```

## Themed without specificity wars

The default stylesheet is wrapped in `@layer vselect`, so consumer rules
written outside any layer always win. All colors, spacing, and motion live
as CSS custom properties under the `.vselect` namespace — override at any
cascade level, no SCSS recompile required.

```css
.my-form .vselect {
  --vselect-accent: #ec4899;
  --vselect-radius: 12px;
}
```

## Tiny

| | gzipped |
|---|---|
| JS (ESM) | ~10.7 kB |
| JS (CJS) | ~9.5 kB |
| CSS | ~2.8 kB |

Plus a Nuxt module for one-line setup. Zero runtime deps beyond
`@floating-ui/vue`.

## What it isn't

- Not a fuzzy-search engine. The default filter is `label.toLowerCase().includes(query)`. Pass a custom `filter` prop for fuzzy.
- Not a virtual list. Renders every option in the menu. For 10k+ options use the `option` slot to render your own virtualized list.
- Not a date / color / file picker. It's a select.
