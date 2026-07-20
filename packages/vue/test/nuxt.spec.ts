import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createRequire } from 'node:module'

// The Nuxt module registered every component, composable and the stylesheet
// against `@anil-labs/select-core`, which exports none of them — core is the
// framework-agnostic package. The documented one-liner setup therefore failed
// three independent ways, and it shipped in dist. There was no test.

const addComponent = vi.fn()
const addImportsSources = vi.fn()

vi.mock('@nuxt/kit', () => ({
  defineNuxtModule: (definition: unknown) => definition,
  addComponent,
  addImportsSources,
}))

interface ModuleDef {
  meta: { name: string }
  defaults: Record<string, unknown>
  setup: (options: Record<string, unknown>, nuxt: unknown) => void
}

async function runModule(overrides: Record<string, unknown> = {}) {
  const mod = ((await import('@/nuxt')) as unknown as { default: ModuleDef }).default
  const nuxt = { options: { css: [] as string[] } }
  mod.setup({ ...mod.defaults, ...overrides }, nuxt)
  return { mod, nuxt }
}

beforeEach(() => {
  addComponent.mockClear()
  addImportsSources.mockClear()
})

describe('nuxt module', () => {
  it('registers components from the Vue package, not core', async () => {
    await runModule({ components: true })

    expect(addComponent).toHaveBeenCalled()
    for (const call of addComponent.mock.calls) {
      expect((call[0] as { filePath: string }).filePath).toBe('@anil-labs/select-vue')
    }
  })

  it('auto-imports composables from the Vue package', async () => {
    await runModule({ components: false, composables: true })

    expect(addImportsSources).toHaveBeenCalledWith(
      expect.objectContaining({ from: '@anil-labs/select-vue' }),
    )
  })

  it('injects a stylesheet subpath that actually resolves', async () => {
    const { nuxt } = await runModule({ css: true })

    const [styleEntry] = nuxt.options.css
    // Plural — core exports "./styles.css". The module asked for "style.css".
    expect(styleEntry).toBe('@anil-labs/select-core/styles.css')

    // And prove it resolves, so the singular/plural typo cannot come back.
    const require = createRequire(import.meta.url)
    expect(() => require.resolve(styleEntry!)).not.toThrow()
  })

  it('names itself after the package it ships in', async () => {
    const { mod } = await runModule()
    expect(mod.meta.name).toBe('@anil-labs/select-vue')
  })
})
