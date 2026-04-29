/**
 * Commit-message lint config.
 *
 * Built on `@commitlint/config-conventional` (the
 * https://www.conventionalcommits.org/ spec) — the same convention used
 * by Vue, Nuxt, Vite, Vitest, and most of the JS ecosystem. The shape
 * matters because it lets us auto-generate changelog entries and version
 * bumps later without re-classifying every commit by hand.
 *
 * Allowed types (rule: `type-enum`):
 *   feat     — a user-facing new feature
 *   fix      — a user-facing bug fix
 *   docs     — README / CHANGELOG / docs site
 *   style    — formatting, whitespace, no code change
 *   refactor — code change that's neither feat nor fix
 *   perf     — performance improvement
 *   test     — adding or correcting tests
 *   build    — build tooling, deps, vite/tsconfig/package.json
 *   ci       — GitHub Actions / workflow changes
 *   chore    — anything that doesn't fit the above and isn't user-facing
 *   revert   — `git revert` style undo
 *
 * Subject (rule: `subject-case`) is lowercase, no trailing period.
 * Header length capped at 100 chars; body lines wrap at 100.
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
}
