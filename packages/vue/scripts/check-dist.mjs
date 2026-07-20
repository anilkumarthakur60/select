#!/usr/bin/env node
// Post-build guard for the *emitted bundle*, not the sources.
//
// The unit suite compiles src/*.tsx through @vitejs/plugin-vue-jsx and never
// imports dist, so it cannot see a broken build. It didn't: the published
// bundle was once compiled with the classic React JSX factory and every
// component threw `ReferenceError: React is not defined` on first render while
// all 66 tests stayed green. This script mounts the real artifact — both the
// ESM and the CJS entry, since Nuxt/SSR consumers take the require path — and
// fails the build if it cannot render.
//
// Run automatically as part of `pnpm build`.

import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readFileSync } from 'node:fs'

const here = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(here, '..')
const require = createRequire(resolve(pkgRoot, 'package.json'))

const failures = []
const fail = (msg) => failures.push(msg)

// ---------------------------------------------------------------- static scan
// Cheap and precise: catches the exact regression above even if a render
// happens to succeed for some other reason.
for (const file of ['dist/index.js', 'dist/index.cjs']) {
  const src = readFileSync(resolve(pkgRoot, file), 'utf8')
  const reactFactoryCalls = (src.match(/React\.createElement/g) ?? []).length
  if (reactFactoryCalls > 0) {
    fail(
      `${file}: ${reactFactoryCalls} React.createElement call(s) — the JSX ` +
        `transform fell back to the classic React factory. Check ` +
        `esbuildOptions in tsup.config.ts.`,
    )
  }
  if (!src.includes('vue/jsx-runtime')) {
    fail(`${file}: does not import vue/jsx-runtime — JSX is not compiling through Vue.`)
  }
}

// ---------------------------------------------------------------- live render
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<!doctype html><html><body></body></html>')
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'SVGElement']) {
  globalThis[key] = dom.window[key] ?? dom.window
}

const Vue = require('vue')

// Minimum props each component needs to render standalone. VSelectOption and
// VTreeSelectNode are omitted: they depend on parent-provided context and are
// exercised by the unit suite instead.
const SPECS = {
  VSelect: { options: ['a', 'b'], modelValue: null },
  VTreeSelect: { options: [{ id: 'a', label: 'A' }], modelValue: null },
  VSelectTag: { option: { value: 'a', label: 'A', disabled: false, raw: 'a' } },
}

async function mountAll(label, mod) {
  for (const [name, props] of Object.entries(SPECS)) {
    const Component = mod[name]
    if (!Component) {
      fail(`${label}: ${name} is not exported from the bundle.`)
      continue
    }

    const host = dom.window.document.createElement('div')
    dom.window.document.body.appendChild(host)

    let renderError = null
    const app = Vue.createApp({
      render: () => Vue.h(Component, props),
    })
    app.config.warnHandler = () => {}
    app.config.errorHandler = (err) => {
      renderError = err
    }
    app.mount(host)

    if (renderError) {
      fail(
        `${label}: ${name} threw on render — ${renderError.constructor.name}: ${renderError.message}`,
      )
    } else if (host.innerHTML === '' || host.innerHTML === '<!---->') {
      fail(`${label}: ${name} rendered nothing (${JSON.stringify(host.innerHTML)}).`)
    }
    app.unmount()
  }
}

await mountAll('dist/index.js (ESM)', await import(resolve(pkgRoot, 'dist/index.js')))
await mountAll('dist/index.cjs (CJS)', require(resolve(pkgRoot, 'dist/index.cjs')))

// ---------------------------------------------------------------------- report
if (failures.length > 0) {
  console.error('\ncheck-dist FAILED:\n')
  for (const f of failures) console.error(`  ✗ ${f}`)
  console.error('')
  process.exit(1)
}

console.log('check-dist: bundle renders (ESM + CJS), JSX compiled through Vue.')
