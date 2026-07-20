import { defineSelectElement } from '@anil-labs/select-element'
import { fruits, countries, plans, categories, flatCategories } from '../shared/data'
import { renderTreeSelect } from './tree-select'
import '@anil-labs/select-core/styles.css'

defineSelectElement('a-select')

// Type alias for accessing the SelectElement-specific properties without
// importing the class — keeps this file framework-free.
type SelectEl = HTMLElement & { options: unknown[]; value: unknown }

// Theme switch — the WC honours `theme="dark|light|auto"` directly.
const main = document.getElementById('root')!
const themeSwitch = document.getElementById('theme-switch') as HTMLSelectElement
themeSwitch.addEventListener('change', () => {
  const theme = themeSwitch.value
  main.classList.toggle('dark', theme === 'dark')
  document.querySelectorAll<SelectEl>('a-select').forEach((el) => el.setAttribute('theme', theme))
})

// --- Basic single-select ---
const basic = document.getElementById('basic') as SelectEl
basic.options = fruits
const basicOut = document.getElementById('basic-out')!
basic.addEventListener('change', (event) => {
  const detail = (event as CustomEvent).detail
  basicOut.textContent = JSON.stringify({ fruit: detail }, null, 2)
})

// --- Multi-select ---
const multi = document.getElementById('multi') as SelectEl
multi.options = countries.map((c) => ({ value: c.code, label: c.name }))
multi.value = ['us', 'jp']
const multiOut = document.getElementById('multi-out')!
multiOut.textContent = JSON.stringify({ selected: multi.value }, null, 2)
multi.addEventListener('change', (event) => {
  const detail = (event as CustomEvent).detail
  multiOut.textContent = JSON.stringify({ selected: detail }, null, 2)
})

// --- Tags ---
const tags = document.getElementById('tags') as SelectEl
let tagPool = ['vue', 'react', 'svelte', 'solid', 'web-components']
tags.options = tagPool
tags.value = ['web-components']
const tagsOut = document.getElementById('tags-out')!
tagsOut.textContent = JSON.stringify({ tags: tags.value }, null, 2)
tags.addEventListener('change', (event) => {
  const detail = (event as CustomEvent).detail
  tagsOut.textContent = JSON.stringify({ tags: detail }, null, 2)
})
tags.addEventListener('create', (event) => {
  const value = (event as CustomEvent<string>).detail
  if (!tagPool.includes(value)) tagPool = [...tagPool, value]
  tags.options = tagPool
  const next = Array.isArray(tags.value) ? tags.value : []
  tags.value = next.includes(value) ? next : [...next, value]
  tagsOut.textContent = JSON.stringify({ tags: tags.value }, null, 2)
})

// --- Sizes (sharing one selected value across three sizes) ---
const sizeOut = document.getElementById('size-out')!
const planOptions = plans.map((p) => ({
  value: p.value,
  label: p.label,
  disabled: 'disabled' in p ? p.disabled : false,
}))
let sharedPlan: unknown = 'pro'

for (const id of ['size-sm', 'size-md', 'size-lg']) {
  const el = document.getElementById(id) as SelectEl
  el.options = planOptions
  el.value = sharedPlan
  el.addEventListener('change', (event) => {
    sharedPlan = (event as CustomEvent).detail
    for (const peerId of ['size-sm', 'size-md', 'size-lg']) {
      if (peerId !== id) (document.getElementById(peerId) as SelectEl).value = sharedPlan
    }
    sizeOut.textContent = JSON.stringify({ plan: sharedPlan }, null, 2)
  })
}
sizeOut.textContent = JSON.stringify({ plan: sharedPlan }, null, 2)

// --- Loading toggle ---
const loader = document.getElementById('loader') as SelectEl
loader.options = ['First', 'Second', 'Third']
document.getElementById('toggle-loader')!.addEventListener('click', () => {
  loader.toggleAttribute('loading')
})

// --- Tree (multi-level) ---
renderTreeSelect({
  mount: document.getElementById('tree-mount')!,
  out: document.getElementById('tree-out')!,
  options: categories,
  initial: [4, 8],
  outKey: 'selectedTree',
  placeholder: 'Pick categories',
  maxVisibleTags: 3,
})

// --- Tree (flat) ---
renderTreeSelect({
  mount: document.getElementById('tree-flat-mount')!,
  out: document.getElementById('tree-flat-out')!,
  options: flatCategories,
  initial: [],
  outKey: 'selectedFlat',
  placeholder: 'Pick frameworks',
})
