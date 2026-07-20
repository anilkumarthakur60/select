import { defineConfig } from 'tsup'

// No framework deps — this is the escape hatch for everything else.
//
// tsup bundles declarations into one .d.ts per entry, so the emitted types
// carry no internal relative specifiers. That matters: extensionless relative
// specifiers are illegal under `moduleResolution: "node16"`, and because
// consumers usually run `skipLibCheck: true` the diagnostic is swallowed while
// resolution still fails — silently degrading the public API to `any`.
export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  tsconfig: 'tsconfig.tsup.json',
  sourcemap: false,
  clean: true,
  treeshake: true,
  target: 'es2022',
  outDir: 'dist',
  external: ['@anil-labs/select-core', ...[]],
})
