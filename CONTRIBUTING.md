# Contributing

Thanks for considering a contribution. The aim of this guide is to get you
to a working PR as quickly as possible.

## Development setup

```bash
git clone https://github.com/anilkumarthakur60/vue3-select.git
cd vue3-select
npm install
```

That's it — no submodules, no codegen step.

## Day-to-day commands

| Command | What it does |
|---|---|
| `npm run dev` | Run the playground at http://localhost:5173 |
| `npm test` | Run the full vitest suite |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report → `coverage/` |
| `npm run lint` | Run oxlint + eslint with `--fix` |
| `npm run format` | Apply prettier |
| `npm run type-check` | `vue-tsc --build` |
| `npm run build` | Type-check + lib build → `dist/` |
| `npm run docs:dev` | VitePress docs locally |
| `npm run docs:build` | Build the docs to `docs/.vitepress/dist` |

## Repo layout

```
src/
  components/    SFCs that ship to consumers
  composables/   Headless primitives (also exported)
  core/          Pure helpers — no Vue, no DOM
  styles/        SCSS partials, CSS custom properties, theme presets
  types/         Public TypeScript surface
  nuxt.ts        Nuxt module
  plugin.ts      Optional Vue plugin entry
  index.ts       Package entry — every public export lives here
tests/           vitest specs (composables, core, components)
docs/            VitePress docs site
playground/      Standalone dev playground (vite.config.dev.ts)
```

## Pull request checklist

Before you open a PR:

- [ ] `npm test` is green (existing tests + new tests for new behavior)
- [ ] `npm run lint` is clean
- [ ] `npm run type-check` passes
- [ ] `npm run build` produces a clean `dist/`
- [ ] If the public API changed, the README, the relevant doc page, and
      `CHANGELOG.md` are updated
- [ ] If you added a new export, it's listed in `src/index.ts`

CI runs all of the above automatically on every PR.

## Style

- Prettier handles formatting; run `npm run format` if your editor doesn't
- ESLint config is intentionally conservative — most "rules" are encoded as
  conventions in the existing code, so reading the surrounding file is the
  best style guide
- For SFCs: `<script setup lang="ts">` with `defineProps` / `defineEmits` /
  `defineSlots`. Avoid the Options API.
- For composables: state machine in, ref-based contract out. They run
  during `setup()` so use `onScopeDispose` for cleanup, not
  `onBeforeUnmount`.
- Comments: only when the **why** is non-obvious. The code already says the
  what.

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/), enforced
by `commitlint` both locally (via [Husky](https://typicode.github.io/husky/)
on `commit-msg`) and in CI (`.github/workflows/commitlint.yml` lints every
commit on the PR plus the PR title).

Format:

```
<type>(<optional scope>): <subject>

<optional body>

<optional footer>
```

Allowed `<type>` values:

| Type | Use for |
|---|---|
| `feat` | A user-facing new feature |
| `fix` | A user-facing bug fix |
| `docs` | README / CHANGELOG / docs site |
| `style` | Formatting, whitespace — no code change |
| `refactor` | Code change that's neither feat nor fix |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `build` | Build tooling, deps, vite/tsconfig/package.json |
| `ci` | GitHub Actions / workflow changes |
| `chore` | Anything else that isn't user-facing |
| `revert` | A `git revert` style undo |

Subject is lowercase, no trailing period, ≤100 chars.

Examples:

```
feat: add caseSensitive prop to <VSelect>
fix(tree): emit deselect for indeterminate parent toggle
docs: clarify async loading example
chore(deps): bump @floating-ui/vue to 1.1.0
```

Breaking changes go in the footer with `BREAKING CHANGE:` prefix:

```
feat: rename modelValue to model

BREAKING CHANGE: the `modelValue` prop is now `model`.
Migration: search-replace `modelValue` → `model` on every <VSelect>.
```

Why this matters: with conventional commits, the changelog and version
bumps can be derived mechanically (we'll likely add `release-please` or
`changesets` next), and the `master` git log reads as a coherent
spec-revision document.

## Git hooks

Husky installs hooks automatically on `npm install` via the `prepare` script.
Two hooks fire locally:

- **`pre-commit`** runs `npm run lint` (oxlint + cached eslint — typically
  under 1 s). Skip with `git commit --no-verify` for WIP commits.
- **`commit-msg`** runs `commitlint --edit` against your message. There's no
  bypass for this one because the CI workflow lints every commit on the PR
  anyway — skipping locally just means failing later.

To reinstall the hooks (e.g. if you cloned with `npm ci --ignore-scripts`):

```bash
npx husky
```

Hook scripts live in `.husky/`:

```
.husky/
├── pre-commit       # npm run lint
└── commit-msg       # npx commitlint --edit "$1"
```

## Releasing (maintainers only)

```bash
npm version patch   # or minor / major — updates package.json + CHANGELOG
git push --follow-tags
```

The `release.yml` workflow fires on tag push and publishes to npm with
provenance.

## Questions?

Open an [issue](https://github.com/anilkumarthakur60/vue3-select/issues) — happy to
discuss before you write code.
