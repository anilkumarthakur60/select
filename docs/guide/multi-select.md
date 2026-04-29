# Multi Select

Pick many values at once. Set `mode="multiple"` and v-model becomes an
array.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const skills = ref<string[]>([])
</script>

<template>
  <VSelect
    v-model="skills"
    mode="multiple"
    :options="['TypeScript', 'Vue', 'React', 'Svelte', 'Solid']"
  />
</template>
```

<script setup lang="ts">
import { ref } from 'vue'
const skills = ref<string[]>([])
const overflow = ref<string[]>(['TypeScript', 'Vue', 'React', 'Svelte'])
const capped = ref<string[]>([])
const checkbox = ref<string[]>(['Push'])
</script>

<div class="demo" style="max-width: 480px;">
  <VSelect
    v-model="skills"
    mode="multiple"
    :options="['TypeScript', 'Vue', 'React', 'Svelte', 'Solid', 'Angular', 'Qwik']"
  />
  <div class="demo-meta">Selected: <code>{{ JSON.stringify(skills) }}</code></div>
</div>

## Tag overflow

When you don't want the trigger to grow unboundedly, cap visible tags with
`max-visible-tags`. Extras collapse into a `+N` chip.

```vue
<VSelect v-model="picked" mode="multiple" :options="opts" :max-visible-tags="3" />
```

<div class="demo" style="max-width: 480px;">
  <VSelect
    v-model="overflow"
    mode="multiple"
    :options="['TypeScript', 'Vue', 'React', 'Svelte', 'Solid', 'Angular', 'Qwik']"
    :max-visible-tags="2"
  />
  <div class="demo-meta">Selected: <code>{{ JSON.stringify(overflow) }}</code></div>
</div>

## Selection cap

`max-selections` is a hard limit — picks past the cap silently no-op. Pair
with `:disabled` on a "you've reached the limit" hint slot if you want a
visible state.

```vue
<VSelect v-model="picked" mode="multiple" :options="opts" :max-selections="3" />
```

<div class="demo" style="max-width: 480px;">
  <VSelect
    v-model="capped"
    mode="multiple"
    :options="['One', 'Two', 'Three', 'Four', 'Five']"
    :max-selections="3"
    placeholder="Pick up to three"
  />
  <div class="demo-meta">Selected: <code>{{ JSON.stringify(capped) }}</code></div>
</div>

## Removing tags

- Click the × button on the tag
- Press <kbd>Backspace</kbd> when the search input is empty — pops the last tag
- Programmatically: bind to `@deselect` or call `instance.clear()`

## Closing on each pick

By default, multi mode keeps the menu open after a pick (you'll usually want
to grab another one). Override with `:close-on-select="true"`:

```vue
<VSelect v-model="x" mode="multiple" :options="opts" :close-on-select="true" />
```

## Checkbox-style menu

Out of the box, selected options get a check glyph on the right of the row.
Some designs prefer a leading **checkbox** for each option — a familiar
"pick from a list" affordance. Use the `option` slot to render one:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const notify = ref<string[]>(['Push'])
const channels = ['Email', 'Push', 'SMS', 'Slack', 'Webhook']
</script>

<template>
  <VSelect v-model="notify" mode="multiple" :options="channels">
    <template #option="{ option, selected }">
      <input
        type="checkbox"
        :checked="selected"
        tabindex="-1"
        readonly
        style="margin-right: 8px; pointer-events: none;"
      />
      <span>{{ option.label }}</span>
    </template>
  </VSelect>
</template>
```

<div class="demo" style="max-width: 480px;">
  <VSelect
    v-model="checkbox"
    mode="multiple"
    :options="['Email', 'Push', 'SMS', 'Slack', 'Webhook']"
    placeholder="Notification channels"
    :close-on-select="false"
  >
    <template #option="{ option, selected }">
      <input
        type="checkbox"
        :checked="selected"
        tabindex="-1"
        readonly
        style="margin-right: 8px; pointer-events: none;"
      />
      <span>{{ option.label }}</span>
    </template>
  </VSelect>
  <div class="demo-meta">Selected: <code>{{ JSON.stringify(checkbox) }}</code></div>
</div>

A few small but important details:

- **`pointer-events: none` on the checkbox** — the row's `mousedown` already
  handles toggle. Letting the native checkbox process clicks would cause a
  double-toggle (input fires, then row fires).
- **`tabindex="-1"`** — the row is the focus target via
  `aria-activedescendant`; the checkbox shouldn't steal Tab order.
- **`readonly`** — visual reflection only. The component is the source of
  truth.
- **No keyboard `change` handler needed** — `useKeyboardNav` already maps
  Space / Enter to "select active row".

For a tree of checkboxes (categories with tri-state parents), use
[`<VTreeSelect>`](./tree-select) — it ships native checkboxes and the
indeterminate state out of the box.
