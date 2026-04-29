<script setup lang="ts">
import { computed, ref } from 'vue'
import BasicExample from './examples/BasicExample.vue'
import MultiExample from './examples/MultiExample.vue'
import TagsExample from './examples/TagsExample.vue'
import AsyncExample from './examples/AsyncExample.vue'
import CustomSlotExample from './examples/CustomSlotExample.vue'
import SizesExample from './examples/SizesExample.vue'
import TreeExample from './examples/TreeExample.vue'

const theme = ref<'light' | 'dark' | 'auto'>('light')
const themeBg = computed(() => (theme.value === 'dark' ? '#0b1220' : '#f8fafc'))
const themeFg = computed(() => (theme.value === 'dark' ? '#e2e8f0' : '#0f172a'))
</script>

<template>
  <main :style="{ background: themeBg, color: themeFg }">
    <header>
      <div class="brand">
        <span class="logo">▲</span>
        <h1>@anilkumarthakur/vue3-select</h1>
        <span class="tag">v0.1.0</span>
      </div>
      <p class="lead">
        A typed, accessible, headless-friendly select for Vue 3. Single, multi, tags, async, grouped
        — one component, zero surprises.
      </p>
      <label class="theme-switch">
        Theme
        <select v-model="theme">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </label>
    </header>

    <section class="grid">
      <div class="single-row">
        <BasicExample :theme="theme" />
      </div>

      <div class="single-row">
        <MultiExample :theme="theme" />
      </div>

      <div class="single-row">
        <TagsExample :theme="theme" />
      </div>

      <div class="single-row">
        <AsyncExample :theme="theme" />
      </div>

      <div class="single-row">
        <CustomSlotExample :theme="theme" />
      </div>

      <div class="single-row">
        <SizesExample :theme="theme" />
      </div>

      <div class="single-row">
        <TreeExample :theme="theme" />
      </div>
    </section>

    <footer>
      <p>
        Press <kbd>↓</kbd>/<kbd>↑</kbd> to navigate, <kbd>Enter</kbd> to select, <kbd>Esc</kbd> to
        close, <kbd>⌫</kbd> to remove the last tag.
      </p>
    </footer>
  </main>
</template>

<style>
:root {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
main {
  width: 100vw;
  min-height: 100vh;
  padding: 48px 32px 80px;
  transition:
    background 200ms ease,
    color 200ms ease;
  box-sizing: border-box;
}
header {
  margin: 0 0 40px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand .logo {
  font-size: 22px;
  color: #6366f1;
}
.brand h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.brand .tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-weight: 600;
}
.lead {
  margin: 12px 0 0;
  max-width: 620px;
  color: inherit;
  opacity: 0.75;
  line-height: 1.55;
}
.theme-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  font-size: 13px;
  opacity: 0.85;
}
.theme-switch select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
}
.grid {
  width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.single-row {
  width: 100%;
}
.card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
[style*='#0b1220'] .card {
  background: rgba(30, 41, 59, 0.4);
  border-color: rgba(255, 255, 255, 0.08);
}
.card h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.7;
}
.card p {
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
  line-height: 1.5;
}
.card pre {
  margin: 0;
  padding: 10px 12px;
  font-size: 12px;
  background: rgba(15, 23, 42, 0.05);
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'SFMono-Regular', Menlo, monospace;
}
[style*='#0b1220'] .card pre {
  background: rgba(255, 255, 255, 0.04);
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.user-row {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
}
.user-row .muted {
  font-size: 0.8em;
  color: var(--vselect-text-muted);
}
.flag {
  font-size: 1.2em;
  line-height: 1;
}
footer {
  /* max-width: 1080px; */
  margin: 60px 0 0;
  font-size: 13px;
  opacity: 0.65;
}
kbd {
  font-family: inherit;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(15, 23, 42, 0.12);
}
code {
  font-family: 'SFMono-Regular', Menlo, monospace;
  font-size: 0.92em;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.06);
}
</style>
