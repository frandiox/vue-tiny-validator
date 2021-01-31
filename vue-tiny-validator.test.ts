import { createApp, defineComponent, ref, h } from 'vue'
import { useField, useForm } from './vue-tiny-validator'

function mount<V>(Comp: V) {
  const el = document.createElement('div')
  const app = createApp(Comp)

  const unmount = () => app.unmount(el)
  const comp = app.mount(el) as any
  comp.unmount = unmount
  return comp
}

describe('Tiny Validator', () => {
  it('validates fields without a parent form', () => {
    const input = ref('hello')
    const isRequired = (v: string) => !!v || 'Required'

    const vm = mount(
      defineComponent({
        setup() {
          return useField({
            value: input,
            rules: [isRequired],
            form: null,
          })
        },
        render() {},
      })
    )

    expect(vm.validate()).toBeTruthy()
    expect(vm.error).toBeFalsy()

    input.value = ''
    expect(vm.validate()).toBeFalsy()
    expect(vm.error).toEqual('Required')

    vm.reset()
    expect(vm.error).toBeFalsy()
  })

  it('validates forms with multiple children', () => {
    const input1 = ref('')
    const input2 = ref('')
    const isRequired = (v: string) => !!v || 'Required'

    const child = defineComponent({
      setup() {
        const field1 = useField({
          value: input1,
          rules: [isRequired],
          identifier: 'i1',
        })

        const field2 = useField({
          value: input2,
          rules: [isRequired],
          identifier: 'i2',
        })

        return { field1, field2 }
      },
      render() {},
    })

    const vm = mount(
      defineComponent({
        components: { child },
        setup() {
          return useForm()
        },
        render() {
          return h(child)
        },
      })
    )

    expect(vm.errors).toHaveLength(0)
    vm.validate()

    expect(vm.errors).toHaveLength(2)
    expect(vm.errors).toEqual(
      expect.arrayContaining([
        { message: 'Required', value: '', identifier: 'i1' },
        { message: 'Required', value: '', identifier: 'i2' },
      ])
    )

    vm.reset()
    expect(vm.errors).toHaveLength(0)
    expect(vm.isValid).toBeTruthy()

    input1.value = 'hello'
    vm.validate()
    expect(vm.errors).toHaveLength(1)
  })

  it('validates forms asynchronously', async () => {
    const input1 = ref('')
    const input2 = ref('')
    const isRequired = (v: string) =>
      new Promise((resolve) =>
        setTimeout(() => resolve(!!v || 'Required'), 100)
      )

    const child = defineComponent({
      setup() {
        const field1 = useField({
          value: input1,
          rules: [isRequired],
          identifier: 'i1',
        })

        const field2 = useField({
          value: input2,
          rules: [isRequired],
          identifier: 'i2',
        })

        return { field1, field2 }
      },
      render() {},
    })

    const vm = mount(
      defineComponent({
        components: { child },
        setup() {
          return useForm()
        },
        render() {
          return h(child)
        },
      })
    )

    expect(vm.errors).toHaveLength(0)
    const promise = vm.validateAsync()
    expect(vm.errors).toHaveLength(0)

    await promise

    expect(vm.errors).toHaveLength(2)
    expect(vm.errors).toEqual(
      expect.arrayContaining([
        { message: 'Required', value: '', identifier: 'i1' },
        { message: 'Required', value: '', identifier: 'i2' },
      ])
    )

    vm.reset()
    expect(vm.errors).toHaveLength(0)
    expect(vm.isValid).toBeTruthy()

    input1.value = 'hello'
    await vm.validateAsync()
    expect(vm.errors).toHaveLength(1)
  })
})
