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

      // These three were set to 'warn' during the monorepo split, when
      // type-aware linting first surfaced 11 pre-existing defects that the old
      // non-type-checked setup could not see. All 11 are now fixed or
      // explicitly refuted, so they are back to 'error' — the warn tier existed
      // to keep a known backlog visible, and there is no backlog left.
      //
      //   no-base-to-string    fixed: labels route through core's safeLabel(),
      //                        which falls back to the option value and warns
      //                        once in dev instead of rendering "[object Object]"
      //   no-floating-promises fixed: nextTick callbacks go through afterTick(),
      //                        which reports into app.config.errorHandler
      //                        rather than dropping the rejection
      //   unbound-method       one site remains, disabled inline in
      //                        packages/svelte/src/adapter.ts with the reason:
      //                        the audit verified it does not reproduce
      //
      // Keeping them at 'error' means a regression fails CI rather than
      // scrolling past in the output.
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/unbound-method': 'error',
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
