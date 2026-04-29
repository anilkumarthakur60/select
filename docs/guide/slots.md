# Slots

Most parts of `<VSelect>` are slottable so you don't have to fork the
component to customise rendering. All slots are typed against your
option type `T`.

## Per-option rendering

The `option` slot replaces the row inside the menu. You get the normalised
option, plus selected / active / disabled flags.

```vue
<VSelect
  v-model="country"
  :options="countries"
  option-value="code"
  option-label="name"
>
  <template #option="{ option, selected, active }">
    <span class="flag">{{ option.raw.flag }}</span>
    <span :class="{ 'is-active': active, 'is-selected': selected }">
      {{ option.label }}
    </span>
  </template>
</VSelect>
```

<script setup lang="ts">
import { ref } from 'vue'

const countries = [
  { code: 'us', name: 'United States', flag: '🇺🇸' },
  { code: 'fr', name: 'France', flag: '🇫🇷' },
  { code: 'jp', name: 'Japan', flag: '🇯🇵' },
  { code: 'br', name: 'Brazil', flag: '🇧🇷' },
  { code: 'de', name: 'Germany', flag: '🇩🇪' },
]
const country = ref('us')

const skills = ref(['Vue', 'TypeScript'])
</script>

<div class="demo" style="max-width: 360px;">
  <VSelect
    v-model="country"
    :options="countries"
    option-value="code"
    option-label="name"
  >
    <template #option="{ option, selected }">
      <span style="margin-right: 8px;">{{ option.raw.flag }}</span>
      <span :style="{ fontWeight: selected ? 600 : 400 }">{{ option.label }}</span>
    </template>
  </VSelect>
  <div class="demo-meta">Selected: <code>{{ JSON.stringify(country) }}</code></div>
</div>

## Checkbox-style options

A common multi-select skin — a leading checkbox per row instead of the
default trailing check glyph:

```vue
<VSelect v-model="picked" mode="multiple" :options="opts">
  <template #option="{ option, selected }">
    <input
      type="checkbox"
      :checked="selected"
      tabindex="-1"
      readonly
      style="margin-right: 8px; pointer-events: none;"
    />
    {{ option.label }}
  </template>
</VSelect>
```

The row already handles toggle, so `pointer-events: none` on the input
prevents a double-toggle. See [Multi Select → Checkbox-style menu](./multi-select#checkbox-style-menu)
for a live demo and the rationale behind each detail.

## Custom tags

Replace per-tag rendering in multi / tags mode:

```vue
<VSelect v-model="skills" mode="multiple" :options="['Vue', 'React', 'TypeScript', 'Go']">
  <template #tag="{ option, remove }">
    <span class="my-tag">
      ⭐ {{ option.label }}
      <button @mousedown.prevent.stop="remove">×</button>
    </span>
  </template>
</VSelect>
```

## Empty state

The `empty` slot fires either with `mode: 'no-options'` (the source list is
empty — typical of a fresh async control) or `mode: 'no-results'` (a query
yielded nothing). Use the distinction to render different copy.

```vue
<template #empty="{ query, mode }">
  <div v-if="mode === 'no-options'">Type to search…</div>
  <div v-else>No matches for "{{ query }}"</div>
</template>
```

## Loading indicator

Both the in-menu loader and the trailing spinner inside the control go
through the same slot. Distinguish with `inMenu`:

```vue
<template #loader="{ inMenu }">
  <span v-if="inMenu">⏳ Searching…</span>
  <Spinner v-else size="14" />
</template>
```

## Full slot list

| Slot | Props | Replaces |
|---|---|---|
| `prefix` | — | Leading edge of the control |
| `suffix` | — | Trailing edge of the control |
| `value` | `{ selected, isMulti }` | Whole value display area |
| `tag` | `{ option, remove, disabled }` | One tag in multi / tags mode |
| `option` | `{ option, selected, active, disabled }` | One row in the menu |
| `optiongroup` | `{ group }` | A group heading row |
| `empty` | `{ query, mode }` | Empty state contents |
| `loader` | `{ inMenu }` | The loading indicator |
| `dropdownicon` | `{ open }` | The chevron icon |
| `clearicon` | `{ clear }` | The clear button |
| `create` | `{ query, create }` | The "Create &lt;query&gt;" row in tags mode |
