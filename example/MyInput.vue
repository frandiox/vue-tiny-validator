<script lang="ts">
import { defineComponent, watch } from 'vue'
import { useField } from '..'

export default defineComponent({
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    min: {
      type: Number,
      default: 0,
    },
  },
  emits: ['update:modelValue'],
  setup(props) {
    const isRequired = (value: string) => !!value || 'Required'
    const minLength = (value: string) =>
      value.length >= props.min || `Min ${props.min} chars`

    const { error, validate, reset } = useField({
      value: () => props.modelValue,
      rules: [isRequired, minLength],
      identifier: props.label,
    })

    // Optional: validate on model update
    // watch(() => props.modelValue, validate)

    return { error, validate, reset }
  },
})
</script>

<template>
  <div>
    <input
      :value="modelValue"
      :placeholder="label"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="validate"
      @focus="reset"
    />
    <div style="color: red; text-align: left; height: 16px">
      {{ error }}
    </div>
  </div>
</template>
