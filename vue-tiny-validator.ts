import {
  ComputedRef,
  Ref,
  ref,
  isRef,
  inject,
  provide,
  reactive,
  computed,
  onBeforeUnmount,
} from 'vue'

const FormSymbol = Symbol('Form')

export type FormError = {
  identifier?: string
  value: unknown
  message: string
}

export type FormField = {
  validate: () => boolean
  validateAsync: () => Promise<boolean>
  reset: () => void
  error: Ref<string>
  identifier?: string
  value: Ref<unknown>
}

export type FormContext = {
  registerField: (field: FormField) => void
  unregisterField: (field: FormField) => void
}

export type FormRule = (value: any) => unknown

export type FieldOptions = {
  value: Ref<any> | ComputedRef<any> | (() => any)
  rules:
    | FormRule[]
    | Ref<FormRule[]>
    | ComputedRef<FormRule[]>
    | (() => FormRule[])
  identifier?: string
  form?: { [FormSymbol]: FormContext }
}

function checkRulesSync(value: unknown, rules: FormRule[]) {
  for (const rule of rules) {
    const result = rule(value)
    if (result !== true) {
      return result
    }
  }
}

async function checkRulesAsync(value: unknown, rules: FormRule[]) {
  for (const rule of rules) {
    try {
      const result = await rule(value)
      if (result !== true) {
        return result
      }
    } catch (error) {
      return error.message
    }
  }
}

/**
 * Validates a field value against a list of rules.
 *
 * @param options
 * @param options.value           The model-value of the field
 * @param options.rules           List of rules that the value needs to fulfill
 * @param options.identifier      Optional identifier for this field, passed later to the form
 * @param options.form            Optional form context when this field is not a child of the form
 */
export function useField({ value, rules, identifier, form }: FieldOptions) {
  const computedValue = isRef(value) ? value : computed(value)
  const computedRules = isRef(rules)
    ? rules
    : computed(rules instanceof Function ? rules : () => rules)

  const error = ref('')
  const reset = () => {
    error.value = ''
  }

  const validateRulesResult = (result: unknown) => {
    if (result && typeof result === 'string') {
      error.value = result
      return false
    }

    reset()
    return true
  }

  const validate = () =>
    validateRulesResult(
      checkRulesSync(computedValue.value, computedRules.value)
    )

  const validateAsync = () =>
    checkRulesAsync(computedValue.value, computedRules.value).then(
      validateRulesResult
    )

  const context = inject<FormContext | undefined>(
    FormSymbol,
    form?.[FormSymbol]
  )

  if (context) {
    const field = {
      validate,
      validateAsync,
      reset,
      error,
      identifier,
      value: computedValue,
    }

    context.registerField(field)
    onBeforeUnmount(() => context.unregisterField(field))
  }

  return {
    /**
     * Validate field value against rules. Returns true if valid.
     */
    validate,
    /**
     * Validate field value against rules asynchronously. Returns Promise<true> if valid.
     */
    validateAsync,
    /**
     * Computed error message returned by rules. Null if valid.
     */
    error: computed(() => error.value),
    /**
     * Reset the error message.
     */
    reset,
  }
}

/**
 * Validates all the nested field components.
 */
export function useForm() {
  const fields = reactive(new Set() as Set<FormField>)
  const context = {
    registerField(field: FormField) {
      fields.add(field)
    },
    unregisterField(field: FormField) {
      fields.delete(field)
    },
  } as FormContext

  provide(FormSymbol, context)
  const form = { [FormSymbol]: context }

  const errors = computed(() =>
    [...fields]
      .filter((field) => !!field.error)
      .map(({ error, value, identifier }) => ({
        // Refs are lost after values enter the reactive Set (?)
        message: (error as unknown) as string,
        value: value as unknown,
        identifier,
      }))
  )

  const reset = () => {
    for (const field of fields) {
      field.reset()
    }
  }

  const validate = () => {
    reset()

    for (const field of fields) {
      field.validate()
    }

    return errors.value.length === 0
  }

  const validateAsync = async () => {
    reset()
    await Promise.all([...fields].map((field) => field.validateAsync()))
    return errors.value.length === 0
  }

  return {
    /**
     * Validate all nested fields against rules. Returns true if all fields are valid.
     */
    validate,
    /**
     * Validate all nested fields against rules asynchronously. Returns Promise<true> if all fields are valid.
     */
    validateAsync,
    /**
     * Array of errors from rules. Empty array if form is valid.
     */
    errors,
    /**
     * Reset the errors.
     */
    reset,
    /**
     * True when there are no errors.
     */
    isValid: computed(() => errors.value.length === 0),
    /**
     * Form context to pass it to non-nested fields.
     */
    form,
  }
}
