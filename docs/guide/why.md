# Why @anil-labs/select-core?

There are plenty of select components — for Vue, for React, for Svelte,
for everyone. This one earns its place by sweating the parts that other
libraries leave fuzzy, and by doing so **once** in a framework-agnostic
core that every adapter shares.

## One core, every framework

A pure-TypeScript state machine drives every adapter. The keyboard map,
ARIA wiring, focus management, filtering, and tag/create-on-Enter logic
live in `@anil-labs/select-core` (the root entry) and are reused by:

- **Vue** — `<VSelect>`, `<VTreeSelect>`, plugin, composables
- **React** — `<Select>` component + `useSelect` hook
- **Svelte 5** — `createSelectAdapter` headless primitive
- **Solid** — `createSelect` headless primitive
- **Web Component** — `<a-select>` custom element (covers Angular, Lit, Alpine, vanilla, …)

You don't switch select libraries when you switch frameworks, and behaviour
parity is a test pass — not a hope.

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
<VSelect v-model="country" :options="countries" option-value="code" option-label="name" />
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
} from '@anil-labs/select-vue'
```

In React, the same machine is reachable via `useSelect`. In Svelte and
Solid, `createSelectAdapter` / `createSelect` expose it directly. The
core itself (`createSelectMachine` from `@anil-labs/select-core`) is
framework-free TypeScript.

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

## Tiny — pay only for what you import

| Entry                 | gzipped |
| --------------------- | ------- |
| Core (framework-free) | ~5 kB   |
| Vue adapter           | ~13 kB  |
| React adapter         | ~8 kB   |
| Svelte adapter        | ~6 kB   |
| Solid adapter         | ~6 kB   |
| Web Component         | ~8 kB   |
| CSS                   | ~3 kB   |

Each package is its own entry — bundlers only pull in the adapter you
import, and every adapter's only runtime dependency is
`@anil-labs/select-core`. Menu positioning is implemented in-house rather
than pulling in a positioning library, so nothing is downloaded or executed
unless you actually opt into `teleport-to`. A Nuxt module is shipped under
`@anil-labs/select-vue/nuxt` for one-line setup.

## What it isn't

- Not a fuzzy-search engine. The default filter is `label.toLowerCase().includes(query)`. Pass a custom `filter` prop for fuzzy.
- Not a virtual list. Renders every option in the menu. For 10k+ options use the `option` slot to render your own virtualized list.
- Not a date / color / file picker. It's a select.
