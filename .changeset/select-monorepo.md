---
'@anil-labs/select-core': minor
'@anil-labs/select-vue': minor
'@anil-labs/select-react': minor
'@anil-labs/select-svelte': minor
'@anil-labs/select-solid': minor
'@anil-labs/select-element': minor
---

Split the single `@anilkumarthakur/select` package into six independently versioned packages under the `@anil-labs` scope.

Each framework is now its own package rather than a subpath of one, so installing the React adapter no longer pulls Vue-only dependencies into your lockfile, and each adapter declares only the peer dependency it actually needs.

| Before                                    | After                        |
| ----------------------------------------- | ---------------------------- |
| `@anilkumarthakur/select`                 | `@anil-labs/select-core`     |
| `@anilkumarthakur/select/vue`             | `@anil-labs/select-vue`      |
| `@anilkumarthakur/select/vue/nuxt`        | `@anil-labs/select-vue/nuxt` |
| `@anilkumarthakur/select/react`           | `@anil-labs/select-react`    |
| `@anilkumarthakur/select/svelte`          | `@anil-labs/select-svelte`   |
| `@anilkumarthakur/select/solid`           | `@anil-labs/select-solid`    |
| `@anilkumarthakur/select/web-component`   | `@anil-labs/select-element`  |
| `@anilkumarthakur/select/style.css`       | `@anil-labs/select-core/styles.css` |
| `@anilkumarthakur/select/scss`            | `@anil-labs/select-core/scss` |

**Also in this release**

- `ClearButtonProps` is now exported from the core package. Adapters could previously only reach it through a deep `core/machine` import, which the package split makes impossible.
- `toSolidProps` and `toSvelteProps` are generic over `object` instead of taking `Record<string, unknown>`. The machine's prop bags are interfaces, and interfaces have no implicit index signature — so the usage shown in each adapter's own documentation did not typecheck.
- The Vue adapter no longer imports the stylesheet as a side effect. Styles live in the core package and every adapter shares them, so Vue consumers were getting CSS automatically while React/Svelte/Solid consumers had to opt in. Import `@anil-labs/select-core/styles.css` explicitly.
