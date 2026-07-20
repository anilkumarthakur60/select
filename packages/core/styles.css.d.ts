// Type stub for the `@anil-labs/select-core/styles.css` subpath export.
//
// Without this, the stylesheet import printed in every framework guide fails on
// a stock tsconfig with:
//
//   TS2882: Cannot find module or type declarations for side-effect import of
//           '@anil-labs/select-core/styles.css'
//
// Bundler users who already pull in `vite/client` (or an equivalent `*.css`
// shim) never saw it; anyone else had to write their own declaration. Wiring a
// `types` condition onto the export is the fix that costs consumers nothing.
//
// A side-effect import needs no shape, only a module — hence the empty export.
export {}
