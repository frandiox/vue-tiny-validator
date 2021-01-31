<p align="center">
  <img width="200" src="./logo.png">
</p>

# Vue Tiny Validator

[![size](https://badgen.net/bundlephobia/minzip/vue-tiny-validator)](https://bundlephobia.com/result?p=vue-tiny-validator)
[![coverage](https://coveralls.io/repos/github/frandiox/vue-tiny-validator/badge.svg?branch=master)](https://coveralls.io/github/frandiox/vue-tiny-validator?branch=master)

Tiny validation library (<0.7K gzipped) without dependencies for Vue 3 that serves as building blocks. Inspired by `vee-validate` and `vuetify`'s validation.

- Non-intrusive in the way you build or style form components. It simply hooks the `modelValue` and gives you the error message to display.
- Reset validation errors for a specific field or for the whole form.
- Build your own rules as simple functions that return `true` or error message. You control everything, including i18n.
- Supports asynchronous rules (e.g. checking if a field value already exists in DB).
- Fully typed.

## Installation

```sh
npm i vue-tiny-validator
# or
yarn add vue-tiny-validator
```

## Usage

Parent component (form):

```js
import { defineComponent, ref } from 'vue'
import { useForm } from 'vue-tiny-validator'

export default defineComponent({
  setup() {
    const myValue = ref('')
    const { validate, errors } = useForm()

    const submit = () => {
      if (validate()) {
        // Validated, submit form
        // ...
        return
      }

      console.warn('Form errors!', errors.value)
    }

    return { myValue, submit }
  },
})
```

```html
<form @submit.prevent="submit">
  <MyInput v-model="myValue" />
  <button>Submit</button>
</form>
```

Child component (input):

```js
import { defineComponent, watch } from 'vue'
import { useField } from 'vue-tiny-validator'

export default defineComponent({
  name: 'MyInput',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    // Rules return `true` on success or a string with an error message on failure.
    const isRequired = (v) => !!v || 'Required!'

    const { validate, error } = useField({
      value: () => props.modelValue,
      rules: [isRequired],
    })

    // Optionally validate it every time the model changes.
    // This could be debounced, or used in @blur event instead.
    watch(() => props.modelValue, validate)

    return { error }
  },
})
```

```html
<label>
  <input
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
  <span>{{ error }}</span>
</label>
```

See the [example](./example) for more options.

## Rules

Rules are simple functions that return `true` on success or an error message on failure. Examples:

```js
const isRequired = (v) => !!v || 'Required'
const minLength = (v) => v?.length >= 3 || 'Min length 3'
const positiveNumber = (v) => v >= 1 || 'Only positive numbers'
const pattern = (v) => /^[a-z0-9_#]+$/i.test(v) || t('form.invalidPattern') // using vue-i18n
```

### Async rules

Rules can also be asynchronous:

```js
const isUnique = async v => {
  const response = await fetch(`/api/is-unique/${v}`)
  // Assuming API returns non-200 code when not unique
  return response.ok || 'Already in use'
```

In this case, you'll need to use `validateAsync` instead of `validate`:

```js
const { validateAsync } = useForm()

const submit = async () => {
  if (await validateAsync()) {
    // valid, submit
  }

  // invalid
}
```
