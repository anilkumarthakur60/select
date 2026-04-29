# Theming

Every visual decision in the component is exposed as a CSS custom property
on `.vselect`. Override them anywhere in your stylesheet — no SCSS
recompile required.

## The big picture

```css
.vselect {
  --vselect-radius: 8px;
  --vselect-control-min-height: 40px;
  --vselect-bg: #ffffff;
  --vselect-border: #cbd5e1;
  --vselect-text: #0f172a;
  --vselect-accent: #6366f1;
  /* ...etc */
}
```

The default stylesheet is wrapped in `@layer vselect`, so consumer rules
written outside any layer always win the cascade — you don't need
specificity hacks like `.vselect.vselect`.

```css
/* Outside any @layer — beats @layer vselect automatically. */
.my-form .vselect {
  --vselect-accent: #ec4899;
  --vselect-radius: 12px;
}
```

## Built-in themes

```vue
<VSelect theme="light" />  <!-- default -->
<VSelect theme="dark" />
<VSelect theme="auto" />   <!-- follows prefers-color-scheme -->
```

<script setup lang="ts">
import { ref } from 'vue'
const v1 = ref('Vue')
const v2 = ref('Vue')
</script>

<div class="demo" style="display: grid; gap: 16px; grid-template-columns: 1fr 1fr;">
  <div>
    <div class="demo-meta">theme=light</div>
    <VSelect v-model="v1" theme="light" :options="['Vue', 'React', 'Svelte']" />
  </div>
  <div style="background: #0b1220; padding: 12px; border-radius: 8px;">
    <div class="demo-meta" style="color: #cbd5e1;">theme=dark</div>
    <VSelect v-model="v2" theme="dark" :options="['Vue', 'React', 'Svelte']" />
  </div>
</div>

## Accent presets

Two accent presets ship as separate SCSS files. Import the one you want:

```scss
@use '@anilkumarthakur/vue3-select/scss/themes/emerald';
@use '@anilkumarthakur/vue3-select/scss/themes/rose';
```

Then apply via class:

```vue
<VSelect class="vselect--emerald" />
<VSelect class="vselect--rose" />
```

## Token reference

### Sizing

| Token | Default |
|---|---|
| `--vselect-radius` | `8px` |
| `--vselect-radius-sm` | `6px` |
| `--vselect-border-width` | `1px` |
| `--vselect-control-min-height` | `40px` |
| `--vselect-control-min-height-sm` | `32px` |
| `--vselect-control-min-height-lg` | `48px` |
| `--vselect-control-padding-x` | `12px` |
| `--vselect-control-padding-y` | `6px` |
| `--vselect-gap` | `6px` |
| `--vselect-font-size` | `14px` |
| `--vselect-font-size-sm` | `13px` |
| `--vselect-font-size-lg` | `16px` |
| `--vselect-line-height` | `1.4` |

### Surfaces

| Token | Default (light) |
|---|---|
| `--vselect-bg` | `#ffffff` |
| `--vselect-bg-hover` | `#f1f5f9` |
| `--vselect-bg-disabled` | `#f1f5f9` |
| `--vselect-menu-bg` | `#ffffff` |

### Borders

| Token | Default |
|---|---|
| `--vselect-border` | `#cbd5e1` |
| `--vselect-border-hover` | `#94a3b8` |
| `--vselect-border-focus` | `var(--vselect-accent)` |

### Text

| Token | Default |
|---|---|
| `--vselect-text` | `#0f172a` |
| `--vselect-text-muted` | `#64748b` |
| `--vselect-text-placeholder` | `#94a3b8` |
| `--vselect-text-disabled` | `#94a3b8` |

### Accent

| Token | Default |
|---|---|
| `--vselect-accent` | `#6366f1` |
| `--vselect-accent-soft` | `#eef2ff` |
| `--vselect-accent-text` | `#ffffff` |
| `--vselect-danger` | `#ef4444` |
| `--vselect-danger-soft` | `#fef2f2` |

### Options & tags

| Token | Default |
|---|---|
| `--vselect-option-active-bg` | `#f1f5f9` |
| `--vselect-option-selected-bg` | `#eef2ff` |
| `--vselect-option-selected-text` | `#4338ca` |
| `--vselect-tag-bg` | `#f1f5f9` |
| `--vselect-tag-text` | `#0f172a` |
| `--vselect-tag-remove` | `#64748b` |
| `--vselect-tag-remove-hover` | `#ef4444` |

### Effects

| Token | Default |
|---|---|
| `--vselect-focus-ring` | `0 0 0 3px rgba(99, 102, 241, 0.22)` |
| `--vselect-shadow-menu` | `0 10px 28px -12px rgba(15, 23, 42, 0.22), 0 2px 6px -2px rgba(15, 23, 42, 0.08)` |
| `--vselect-z-menu` | `1000` |
| `--vselect-transition` | `120ms cubic-bezier(0.4, 0, 0.2, 1)` |
