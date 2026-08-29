import { defineSelectElement } from '@anil-labs/select-element'
import { renderTreeSelect, type TreeSelectHandle } from '../shared/tree-select'
import { categories, countries, flagFor, flatCategories, fruits, plans } from '../shared/data'
import '@anil-labs/select-core/styles.css'
import './styles.css'

defineSelectElement('a-select')

// The element's public surface, without importing the class  keeps this file
// honest about being framework-free and dependency-light.
type SelectEl = HTMLElement & { options: unknown[]; value: unknown }

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id)
  if (!node) throw new Error(`Landing page markup is missing #${id}`)
  return node as T
}

const select = (id: string): SelectEl => el<HTMLElement>(id) as SelectEl

const show = (target: HTMLElement, value: unknown): void => {
  target.textContent = JSON.stringify(value, null, 2)
}

/** Wire a select so every `change` re-renders its output pane. */
const bindOutput = (node: SelectEl, out: HTMLElement, key: string): void => {
  show(out, { [key]: node.value })
  node.addEventListener('change', (event) => {
    show(out, { [key]: (event as CustomEvent).detail })
  })
}

// ------------------------------------------------------------------ chrome

el('version-badge').textContent = `v${__PKG_VERSION__}`

// --- Install command -------------------------------------------------------

const copyBtn = el<HTMLButtonElement>('install-copy')
copyBtn.addEventListener('click', async () => {
  const command = el('install-cmd').textContent ?? ''
  try {
    await navigator.clipboard.writeText(command)
    copyBtn.textContent = 'Copied'
  } catch {
    // Clipboard access is permission-gated and unavailable over plain http on
    // some browsers. Failing silently would look like a dead button, so say so.
    copyBtn.textContent = 'Copy failed'
  }
  setTimeout(() => {
    copyBtn.textContent = 'Copy'
  }, 1400)
})

// --- Theme -----------------------------------------------------------------

// Tree instances aren't custom elements, so they can't be found by querying the
// DOM for a tag  collect their handles as they're created.
const treeHandles: TreeSelectHandle[] = []

type Theme = 'light' | 'dark' | 'auto'

const themeSwitch = el('theme-switch')

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme

  // The components read `theme` themselves rather than inheriting from the
  // page, so every instance has to be told  including ones added later.
  document.querySelectorAll<SelectEl>('a-select').forEach((node) => {
    node.setAttribute('theme', theme)
  })
  treeHandles.forEach((handle) => handle.setTheme(theme))

  themeSwitch.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.theme === theme))
  })
  themeSwitch.dataset.active = theme
}

themeSwitch.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-theme]')
  if (button) applyTheme(button.dataset.theme as Theme)
})

// ------------------------------------------------------------------- demos

const countryOptions = countries.map((country) => ({
  value: country.code,
  label: `${flagFor(country.code)}  ${country.name}`,
}))

// --- Hero ------------------------------------------------------------------

const hero = select('hero-select')
hero.options = countryOptions
hero.value = 'jp'
bindOutput(hero, el('hero-out'), 'country')

// --- Single ----------------------------------------------------------------

const single = select('d-single')
single.options = fruits
single.value = 'Cherry'
bindOutput(single, el('d-single-out'), 'fruit')

// --- Multiple --------------------------------------------------------------

const multi = select('d-multi')
multi.options = countryOptions
multi.value = ['us', 'in']
bindOutput(multi, el('d-multi-out'), 'selected')

// --- Tags ------------------------------------------------------------------

const tags = select('d-tags')
const tagsOut = el('d-tags-out')
let tagPool = ['typescript', 'accessibility', 'headless', 'design-systems']
tags.options = tagPool
tags.value = ['headless']
bindOutput(tags, tagsOut, 'tags')

tags.addEventListener('create', (event) => {
  const created = (event as CustomEvent<string>).detail
  // `create` only announces the intent  the value doesn't exist as an option
  // yet, so the host owns adding it to the pool and to the selection.
  if (!tagPool.includes(created)) tagPool = [...tagPool, created]
  tags.options = tagPool
  const current = Array.isArray(tags.value) ? tags.value : []
  if (!current.includes(created)) tags.value = [...current, created]
  show(tagsOut, { tags: tags.value })
})

// --- Async -----------------------------------------------------------------

const asyncSelect = select('d-async')
const asyncStatus = el('d-async-status')
const asyncOut = el('d-async-out')
let asyncLoaded = false

bindOutput(asyncSelect, asyncOut, 'users')

function loadAsyncOptions(): void {
  if (asyncLoaded) return
  asyncLoaded = true
  asyncSelect.setAttribute('loading', '')
  asyncStatus.textContent = 'Fetching…'

  // Stand-in for a real request  the point is that `loading` is just an
  // attribute the host drives, not something the component fetches for you.
  setTimeout(() => {
    asyncSelect.options = countries.map((country) => ({
      value: country.code,
      label: `${country.name} · ${country.region}`,
    }))
    asyncSelect.removeAttribute('loading')
    asyncStatus.textContent = `Loaded ${countries.length} records.`
  }, 900)
}

asyncSelect.addEventListener('open', loadAsyncOptions)

el<HTMLButtonElement>('d-async-reset').addEventListener('click', () => {
  asyncLoaded = false
  asyncSelect.options = []
  asyncSelect.value = []
  asyncStatus.textContent = 'Idle  open the menu to fetch.'
  show(asyncOut, { users: [] })
})

// --- Sizes -----------------------------------------------------------------

const sizeIds = ['d-size-sm', 'd-size-md', 'd-size-lg'] as const
const sizeOut = el('d-size-out')
let sharedPlan: unknown = 'pro'

for (const id of sizeIds) {
  const node = select(id)
  node.options = plans
  node.value = sharedPlan
  node.addEventListener('change', (event) => {
    sharedPlan = (event as CustomEvent).detail
    // Mirror onto the peers so all three stay in lockstep  one value, three
    // renderings, which is the whole point of the demo.
    for (const peer of sizeIds) {
      if (peer !== id) select(peer).value = sharedPlan
    }
    show(sizeOut, { plan: sharedPlan })
  })
}
show(sizeOut, { plan: sharedPlan })

// --- States ----------------------------------------------------------------

const stateLive = select('d-state-live')
stateLive.options = plans // `Enterprise` carries disabled: true
stateLive.value = 'free'

const stateLoading = select('d-state-loading')
stateLoading.options = fruits

const stateDisabled = select('d-state-disabled')
stateDisabled.options = fruits
stateDisabled.value = 'Apple'

el<HTMLButtonElement>('d-state-toggle').addEventListener('click', () => {
  stateLoading.toggleAttribute('loading')
})

// --- Tree ------------------------------------------------------------------

treeHandles.push(
  renderTreeSelect({
    mount: el('d-tree-mount'),
    out: el('d-tree-out'),
    options: categories,
    initial: [4, 8],
    outKey: 'categories',
    placeholder: 'Pick categories',
    maxVisibleTags: 3,
  }),
  renderTreeSelect({
    mount: el('d-tree-flat-mount'),
    out: el('d-tree-flat-out'),
    options: flatCategories,
    initial: [],
    outKey: 'frameworks',
    placeholder: 'Pick frameworks',
  }),
)

// ----------------------------------------------------------------- theming

const ACCENTS = {
  indigo: { accent: '#6366f1', soft: '#eef2ff' },
  emerald: { accent: '#10b981', soft: '#ecfdf5' },
  rose: { accent: '#f43f5e', soft: '#fff1f2' },
  amber: { accent: '#f59e0b', soft: '#fffbeb' },
} as const

type AccentName = keyof typeof ACCENTS

const themeDemo = select('d-theme')
themeDemo.options = fruits
themeDemo.value = ['Banana', 'Fig']

const accentScope = el('theming-scope')
const accentSwitch = el('accent-switch')
const accentCode = el('accent-code')

function applyAccent(name: AccentName): void {
  const { accent, soft } = ACCENTS[name]

  // Setting the tokens on an ancestor is the whole theming API  the variables
  // are scoped to `.vselect` but inherit, so any wrapper can override them.
  accentScope.style.setProperty('--vselect-accent', accent)
  accentScope.style.setProperty('--vselect-accent-soft', soft)

  accentCode.textContent = `.my-scope {\n  --vselect-accent: ${accent};\n  --vselect-accent-soft: ${soft};\n}`

  accentSwitch.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.accent === name))
  })
}

accentSwitch.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-accent]')
  if (button) applyAccent(button.dataset.accent as AccentName)
})

applyAccent('indigo')

// -------------------------------------------------------------- frameworks

interface FrameworkDemo {
  slug: string
  label: string
  desc: string
}

const FRAMEWORKS: FrameworkDemo[] = [
  {
    slug: 'vue',
    label: 'Vue 3',
    desc: '<VSelect> and <VTreeSelect> with v-model, scoped slots, async options and the Nuxt module.',
  },
  {
    slug: 'react',
    label: 'React',
    desc: '<Select> with a controlled value, render props, async loading and multi-select.',
  },
  {
    slug: 'svelte',
    label: 'Svelte 5',
    desc: 'Select bound with $bindable value, snippets, groups and a checkbox tree.',
  },
  {
    slug: 'solid',
    label: 'Solid',
    desc: 'Select driven by signals, with async options and keyboard-first combobox behaviour.',
  },
  {
    slug: 'element',
    label: 'Web Component',
    desc: '<a-select> for Angular, Lit, Alpine, Astro, Qwik or plain HTML  no framework required.',
  },
]

el('fw-grid').innerHTML = FRAMEWORKS.map(
  ({ slug, label, desc }) => `
    <a class="fw-card" href="./${slug}/">
      <span class="fw-badge">${label}</span>
      <p class="fw-desc">${escapeText(desc)}</p>
      <span class="fw-cta">Open playground &rarr;</span>
    </a>`,
).join('')

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Apply last so it reaches every control created above.
applyTheme('light')
