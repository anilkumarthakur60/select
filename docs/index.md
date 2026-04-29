---
layout: home

hero:
  name: vue3-select
  text: A typed, accessible select for Vue 3
  tagline: Single, multi, tags, async, grouped, tree — one component, zero surprises.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Why vue3-select?
      link: /guide/why
    - theme: alt
      text: View on GitHub
      link: https://github.com/anilkumarthakur60/vue3-select

features:
  - icon: 🎯
    title: TypeScript-native
    details: Full generics over your option type. Accessors, slots, and emits are all typed against `T` — no `any` escape hatches.
  - icon: ♿
    title: Accessible by default
    details: ARIA-1.2 combobox + listbox / tree semantics, full keyboard nav, focus management across menu open / close / tag removal.
  - icon: 🧩
    title: Headless-friendly
    details: Every primitive is exported as a composable. Build a custom UI without re-implementing the state machine.
  - icon: 🌳
    title: Tree mode included
    details: '`<VTreeSelect>` ships in the box — tri-state parents derived from leaf v-model, search auto-expansion, optional toolbar.'
  - icon: 🎨
    title: Themeable
    details: All design tokens are CSS custom properties under the `.vselect` scope. Light / dark / auto themes plus accent presets.
  - icon: ⚡
    title: Tiny + tree-shakeable
    details: ~10.7 kB gzipped JS, ~2.8 kB CSS, zero runtime deps beyond `@floating-ui/vue`. ESM, CJS, and a Nuxt module ship in the tarball.
---

<script setup lang="ts">
import { ref } from 'vue'

const single = ref('Apple')
const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']
</script>

<div class="demo" style="max-width: 360px; margin: 32px auto;">
  <VSelect v-model="single" :options="fruits" placeholder="Pick a fruit" />
  <div class="demo-meta">Selected: <code>{{ JSON.stringify(single) }}</code></div>
</div>
