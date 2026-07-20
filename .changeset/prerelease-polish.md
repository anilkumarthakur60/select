---
'@anil-labs/select-vue': patch
'@anil-labs/select-react': patch
---

**`<VSelect>` / `<VTreeSelect>`: Enter now commits against the query you typed.**

With `debounce` set, the rendered list lags the query — so pressing Enter before
the trailing edge acted on the *stale* list. Typing `"Gam"` into a
`['Alpha', 'Beta', 'Gamma']` select and hitting Enter committed **`"Alpha"`**,
the first row of the not-yet-filtered list. Type-then-Enter is the ordinary
type-ahead flow, so this fired constantly rather than in some edge case.

Enter now flushes any pending debounce first, then re-resolves the target: a
deliberate highlight is kept when it still matches the new query, otherwise it
falls back to the selected option, else the first enabled one. The same fix
applies to `<VTreeSelect>`'s Enter and Space.

**`@anil-labs/select-react` no longer declares a `react-dom` peer.** The
components render host elements and never import it, so the declaration forced
an install the package doesn't need. `react` remains the only peer; `react-dom`
is whatever your app already renders with.
