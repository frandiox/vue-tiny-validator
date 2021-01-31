<template>
  <form @submit.prevent="submit">
    <div style="display: flex; justify-content: center">
      <MyInput v-model="state.firstName" label="First name" :min="3" />
      <MyInput
        v-model="state.lastName"
        label="Last name"
        style="margin-left: 8px"
        :min="4"
      />
    </div>
    <div style="margin-top: 10px">
      <label>
        <input
          v-model="state.agree"
          type="checkbox"
          style="margin-right: 4px"
        />
        Terms of Service
      </label>
      <div style="color: red; height: 20px">{{ termsError }}</div>
    </div>
    <div style="margin-top: 20px">
      <button type="submit">Submit</button>
      <button type="button" @click="reset" style="margin-left: 10px">
        Reset
      </button>
    </div>
  </form>
  <div style="margin-top: 40px">State: {{ state }}</div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'
import MyInput from './MyInput.vue'
import { useForm, useField } from '..'

export default defineComponent({
  name: 'App',
  components: { MyInput },
  setup() {
    const state = reactive({
      firstName: '',
      lastName: '',
      agree: false,
    })

    const { validate, reset, errors, form } = useForm()

    // Non-nested fields can use the 'form' parameter
    // since they cannot inject the form context directly.
    const { error: termsError } = useField({
      value: () => state.agree,
      rules: [(v) => v === true || 'Required'],
      form,
    })

    const submit = () => {
      if (!validate()) {
        errors.value.forEach((error) =>
          console.log(
            `Error in ${error.identifier}: "${error.message}" for value "${error.value}"`
          )
        )

        return
      }

      console.log('Form is valid', state)
      alert('Form is valid!')
    }

    return { state, submit, reset, termsError }
  },
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
