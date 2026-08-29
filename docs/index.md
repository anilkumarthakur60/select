---
layout: home

hero:
  name: '@anil-labs/select-core'
  text: One typed, accessible select. Every framework.
  tagline: Vue 3 · React · Svelte 5 · Solid · Web Components  single, multi, tags, async, grouped, tree. One core, idiomatic adapters.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Why this library?
      link: /guide/why
    - theme: alt
      text: View on GitHub
      link: https://github.com/anilkumarthakur60/select

features:
  - icon: 🧩
    title: Framework-agnostic core
    details: A pure-TS state machine drives every adapter. Vue, React, Svelte, Solid, and a Web Component all import from `@anil-labs/select-core/<framework>` and share one set of behaviour, semantics, and tests.
  - icon: 🎯
    title: TypeScript-native
    details: Full generics over your option type. Accessors, slots/render props, and emits/handlers are all typed against `T`  no `any` escape hatches in any adapter.
  - icon: ♿
    title: Accessible by default
    details: ARIA-1.2 combobox + listbox / tree semantics, full keyboard nav, focus management across menu open / close / tag removal  implemented once in the core.
  - icon: 🌳
    title: Tree mode included (Vue)
    details: '`<VTreeSelect>` ships in the Vue adapter  tri-state parents derived from leaf v-model, search auto-expansion, optional toolbar.'
  - icon: 🎨
    title: Themeable
    details: All design tokens are CSS custom properties under the `.vselect` scope. Light / dark / auto themes plus accent presets, shared across every adapter.
  - icon: ⚡
    title: Tiny + tree-shakeable
    details: Core ~5 kB gz. Vue ~13 kB · React ~8 kB · Svelte/Solid ~6 kB · Web Component ~8 kB · CSS ~3 kB. Pay only for the adapter you import.
---

<script setup lang="ts">
import { ref } from 'vue'

const single = ref('Apple')
const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']
</script>

<div class="demo" style="max-width: 360px; margin: 32px auto;">
  <VSelect v-model="single" :options="fruits" placeholder="Pick a fruit" />
  <div class="demo-meta">Selected (Vue adapter): <code>{{ JSON.stringify(single) }}</code></div>
</div>
