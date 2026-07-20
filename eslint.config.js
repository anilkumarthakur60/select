// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.tsbuildinfo',
      'docs/**',
      '.changeset/**',
      'dist-demo/**',
      'examples/env.d.ts',
      // Hand-written type stub shipped alongside the CSS export. It lives
      // outside src/, so it is covered by no tsconfig and no projectService
      // block — type-aware rules crash on it, and there is nothing to lint.
      'packages/*/styles.css.d.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // Library source across every package.
  {
    files: ['packages/*/src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',

      // WARN, NOT OFF — these are real, pre-existing defects that only became
      // visible when the monorepo replaced the old non-type-checked lint
      // (oxlint + plain eslint) with type-aware rules. They are NOT caused by
      // the split, and fixing them properly needs regression tests, so they are
      // tracked as audit work rather than patched blind during a restructure:
      //
      //   no-floating-promises (2) unawaited nextTick() in VTreeSelect — a
      //                            throw inside the callback becomes an
      //                            unhandled rejection that bypasses
      //                            app.config.errorHandler entirely
      //   unbound-method (1)       a method read off its object may lose `this`
      //
      // They stay in the lint output so they cannot be quietly forgotten.
      //
      // Fixed so far: every no-base-to-string site (core's normalize/tree/
      // machine and the Vue composables now route through `safeLabel()`), and
      // VSelect's three floating promises (they go through `afterTick()`,
      // which reports into Vue's own error handler). What remains is
      // VTreeSelect, which still has its own copies.
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/unbound-method': 'warn',
    },
  },

  // Tests and examples: same parser, but assertions on deliberately odd input
  // make the unsafe-* family noise rather than signal.
  {
    files: ['packages/*/test/**/*.{ts,tsx}', 'examples/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      // Handing an async function to an event prop (`@search`, `onChange`) is
      // ordinary React/Solid practice in a demo, and tests routinely pull a
      // method off its object to assert on it. Neither is a library concern.
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // Plain JS (configs, example scripts) has no TS project behind it.
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  // Separate block: `disableTypeChecked` carries its own `languageOptions`,
  // so setting globals in the same object would be lost to the spread.
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },

  {
    files: ['**/*.config.{js,mjs,cjs,ts}', 'eslint.config.js'],
    languageOptions: { parserOptions: { projectService: false } },
    ...tseslint.configs.disableTypeChecked,
  },

  prettierConfig,
)
