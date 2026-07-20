---
'@anil-labs/select-element': patch
'@anil-labs/select-svelte': patch
'@anil-labs/select-react': patch
'@anil-labs/select-solid': patch
'@anil-labs/select-core': patch
'@anil-labs/select-vue': patch
---

Fix the published Vue bundle, and make every package installable and documented.

**`@anil-labs/select-vue` was unusable when built.** The bundle was compiled with
the classic React JSX factory, so every component — `VSelect`, `VSelectTag`,
`VTreeSelect`, `VSelectOption` — threw `ReferenceError: React is not defined` on
first render, in both the ESM and the CJS (Nuxt/SSR) entry.

The cause was a split between test and build config: vitest compiles the `.tsx`
sources through `@vitejs/plugin-vue-jsx`, but tsup registered no JSX plugin, and
esbuild only honours `jsxImportSource` under the *automatic* runtime — with
`jsx: "preserve"` it silently fell back to `React.createElement`. No test
imported `dist`, so the whole suite stayed green.

The transform is now overridden in `tsup.config.ts` via `esbuildOptions` rather
than in `tsconfig.json`, because Vue's `jsx-runtime` declares no
`ElementChildrenAttribute` and cannot be type-checked under the automatic
runtime. A new post-build `scripts/check-dist.mjs` mounts the real artifact
(ESM and CJS) in jsdom and fails the build if it cannot render, so this class of
defect can no longer reach npm.

**`@anil-labs/select-core/styles.css` now type-checks.** The stylesheet import
shown in every framework guide failed on a stock tsconfig with `TS2882`. The
subpath export gained a `types` condition pointing at a stub, so consumers no
longer need their own `*.css` shim. Verified under both `bundler` and `node16`
resolution.

**Every package now ships a README.** All six npm pages would previously have
rendered blank.

CI, release and Pages workflows were still written for the pre-monorepo,
npm-with-a-lockfile layout and could not build, test or publish anything. They
now use pnpm workspaces and the Changesets release flow, and CI builds before it
tests so the new bundle guard gates every PR.
