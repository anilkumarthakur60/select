import { defineConfig } from 'tsup'

// Two entries: the components, and the opt-in Nuxt module.
//
// tsup bundles declarations into one .d.ts per entry, so the emitted types
// carry no internal relative specifiers. That matters: extensionless relative
// specifiers are illegal under `moduleResolution: "node16"`, and because
// consumers usually run `skipLibCheck: true` the diagnostic is swallowed while
// resolution still fails — silently degrading the public API to `any`.
export default defineConfig({
  entry: { index: 'src/index.ts', nuxt: 'src/nuxt.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  tsconfig: 'tsconfig.tsup.json',
  sourcemap: false,
  clean: true,
  treeshake: true,
  target: 'es2022',
  outDir: 'dist',
  external: ['@anil-labs/select-core', ...['vue', 'vue/jsx-runtime', '@nuxt/kit', 'nuxt']],

  // REQUIRED — do not remove. tsconfig.json keeps `jsx: "preserve"` because
  // Vue's jsx-runtime declares no `ElementChildrenAttribute`, so under the
  // automatic runtime TypeScript checks `children` as a prop and every element
  // with children fails against `HTMLAttributes & ReservedProps`. But esbuild
  // only honours `jsxImportSource` when the runtime IS automatic — left alone
  // it emitted the classic `React.createElement` factory, so every published
  // component threw `ReferenceError: React is not defined` on first render.
  // That stayed invisible because vitest compiles src through
  // @vitejs/plugin-vue-jsx and no test used to import dist.
  // test/dist-smoke.test.ts now mounts the built bundle and would catch it.
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.jsxImportSource = 'vue'
  },
})
