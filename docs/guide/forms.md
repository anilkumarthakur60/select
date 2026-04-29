# Native Forms

`<VSelect>` integrates with the platform's `<form>` flow via the `name`
prop. Set it and the component renders hidden inputs that participate in
`FormData`, native `submit`, and the validation API.

```vue
<form @submit.prevent="onSubmit">
  <VSelect
    v-model="country"
    :options="countries"
    option-value="code"
    option-label="name"
    name="country"
    required
  />
  <button type="submit">Submit</button>
</form>
```

## Single mode

One hidden input. Empty string when the model is `null` / `undefined`.

```html
<input type="hidden" name="country" value="us">
```

## Multi / tags mode

Many hidden inputs, one per selected value, named with `[]` so PHP-style
servers parse them as arrays:

```html
<input type="hidden" name="skills[]" value="ts">
<input type="hidden" name="skills[]" value="vue">
```

Read them on the server as an array (most server frameworks already do).

## Object values

When a value is an object (rare, but supported), it serialises via
`JSON.stringify`. Decode on the server side. For the common case of "the
value is an id and the label comes from a join", point `option-value` at
the id field — primitives serialise cleanly.

## Required fields

`required` marks the hidden input(s) so the browser's native form validation
kicks in. The component itself doesn't render the red ring — that's a
styling concern; key off `:invalid` or your form library's state.

## Reading the form

```ts
function onSubmit(event: SubmitEvent) {
  const data = new FormData(event.target as HTMLFormElement)
  const country = data.get('country')          // 'us'
  const skills = data.getAll('skills[]')       // ['ts', 'vue']
}
```
