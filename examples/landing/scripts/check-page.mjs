#!/usr/bin/env node
// Post-build guard for the landing page.
//
// The landing page has no unit suite, and a broken demo here fails silently:
// the HTML still renders, the headings still read correctly, and only the
// controls  the entire point of the page  come up empty. Typechecking cannot
// catch it either, since every wiring bug worth having (a renamed id, an
// option list never assigned, a listener bound to the wrong element) is
// type-correct.
//
// So this mounts the real built artifact in jsdom, drives it, and asserts the
// demos actually work.
//
// Usage:  node scripts/check-page.mjs [outDir]     (default: dist)

import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readFileSync } from 'node:fs'

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, '..')
const require = createRequire(resolve(pkgRoot, 'package.json'))

const outDir = resolve(pkgRoot, process.argv[2] ?? 'dist')

const failures = []
const fail = (msg) => failures.push(msg)
const check = (condition, msg) => {
  if (!condition) fail(msg)
}

// ------------------------------------------------------------------ bootstrap

const html = readFileSync(resolve(outDir, 'index.html'), 'utf8')

// Vite hashes the bundle name, so resolve it out of the emitted markup rather
// than guessing.
const scriptSrc = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)?.[1]
if (!scriptSrc) {
  console.error('✗ check-page: no module script found in index.html')
  process.exit(1)
}

const { JSDOM } = require('jsdom')
const dom = new JSDOM(html, { url: 'http://localhost/', pretendToBeVisual: true })

for (const key of [
  'window',
  'document',
  'HTMLElement',
  'Element',
  'Node',
  'CustomEvent',
  'MouseEvent',
  'Event',
  'customElements',
  'navigator',
  'getComputedStyle',
  // Vite's modulepreload polyfill runs before any of our code and reaches for
  // MutationObserver + requestAnimationFrame, neither of which Node provides.
  'MutationObserver',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'HTMLInputElement',
]) {
  // Node ≥21 defines some of these (notably `navigator`) as getter-only
  // accessors on globalThis, so plain assignment throws. defineProperty
  // replaces the descriptor outright and works for both cases.
  Object.defineProperty(globalThis, key, {
    value: dom.window[key] ?? dom.window,
    configurable: true,
    writable: true,
  })
}

// The bundle's top-level code runs on import  that IS the wiring under test.
await import(pathToFileURL(resolve(outDir, scriptSrc.replace(/^\.?\//, ''))).href)

const doc = dom.window.document
const $ = (sel) => doc.querySelector(sel)
const text = (sel) => $(sel)?.textContent ?? ''

// Fire the same event the element listens for. The component binds `mousedown`
// (not `click`) so that selecting never races the control's focus handling.
const mousedown = (el) =>
  el?.dispatchEvent(new dom.window.MouseEvent('mousedown', { bubbles: true, cancelable: true }))

// ------------------------------------------------------------- every control

const selects = [...doc.querySelectorAll('a-select')]
check(selects.length >= 10, `expected the page to mount 10+ <a-select>, found ${selects.length}`)

for (const el of selects) {
  const id = el.id || '(unnamed)'
  check(
    el.querySelector('.vselect-control') !== null,
    `#${id}: rendered no .vselect-control  the custom element never upgraded.`,
  )
  // An empty option list is the signature failure of a broken wiring: the
  // control paints, but there is nothing to pick.
  if (!el.hasAttribute('loading') && id !== 'd-async') {
    check(el.options?.length > 0, `#${id}: has no options assigned.`)
  }
}

// ------------------------------------------------------------- initial state

check(text('#hero-out').includes('jp'), '#hero-out: initial country value not reflected.')
check(text('#d-single-out').includes('Cherry'), '#d-single-out: initial value not reflected.')
check(text('#d-multi-out').includes('us'), '#d-multi-out: initial selection not reflected.')
check(text('#d-tags-out').includes('headless'), '#d-tags-out: initial tags not reflected.')
check(text('#d-size-out').includes('pro'), '#d-size-out: shared plan value not reflected.')
check(text('#d-tree-out').includes('4'), '#d-tree-out: initial tree selection not reflected.')

// ------------------------------------------------------------- interactivity

// Selecting must update the bound output pane  this is the whole contract
// between the component's `change` event and the demo.
const before = text('#d-single-out')
mousedown($('#d-single .vselect-menu [data-action="select"]'))
check(
  text('#d-single-out') !== before,
  '#d-single: selecting an option did not update the output pane.',
)

// Sizes mirror one value across three controls.
mousedown($('#d-size-sm .vselect-menu [data-action="select"]'))
const sm = doc.getElementById('d-size-sm').value
const lg = doc.getElementById('d-size-lg').value
check(sm === lg, `sizes: value did not mirror across controls (sm=${sm}, lg=${lg}).`)

// Tree rows render and are checkable.
const treeRows = doc.querySelectorAll('#d-tree-mount .vselect-tree-row')
check(treeRows.length > 0, '#d-tree-mount: rendered no tree rows.')

// --------------------------------------------------------------- theme switch

const darkBtn = $('#theme-switch button[data-theme="dark"]')
darkBtn?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))

check(
  doc.documentElement.dataset.theme === 'dark',
  'theme switch: <html data-theme> was not set to dark.',
)
check(
  selects.every((el) => el.getAttribute('theme') === 'dark'),
  'theme switch: some <a-select> did not receive theme="dark".',
)
check(
  $('#d-tree-mount')?.className.includes('vselect--dark'),
  'theme switch: the tree instance did not re-theme.',
)
check(
  darkBtn?.getAttribute('aria-pressed') === 'true',
  'theme switch: aria-pressed was not moved to the active button.',
)

// --------------------------------------------------------------- accent switch

$('#accent-switch button[data-accent="emerald"]')?.dispatchEvent(
  new dom.window.MouseEvent('click', { bubbles: true }),
)
check(
  $('#theming-scope')?.style.getPropertyValue('--vselect-accent') === '#10b981',
  'accent switch: --vselect-accent was not applied to the scope.',
)
check(text('#accent-code').includes('#10b981'), 'accent switch: the code sample did not update.')

// ------------------------------------------------------------------ chrome

check(/^v\d/.test(text('#version-badge')), '#version-badge: version was not injected.')

const fwLinks = [...doc.querySelectorAll('#fw-grid a')]
check(fwLinks.length === 5, `#fw-grid: expected 5 framework cards, found ${fwLinks.length}.`)
for (const slug of ['vue', 'react', 'svelte', 'solid', 'element']) {
  check(
    fwLinks.some((a) => a.getAttribute('href') === `./${slug}/`),
    `#fw-grid: no card links to ./${slug}/.`,
  )
}

// ---------------------------------------------------------------------- report

if (failures.length > 0) {
  console.error(`\n✗ check-page: ${failures.length} problem(s) in ${outDir}\n`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

console.log(`✓ check-page: landing demos verified in ${outDir}`)
