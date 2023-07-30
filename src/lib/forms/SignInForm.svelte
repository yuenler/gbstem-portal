<script>
  import Input from '$lib/components/Input.svelte'
  import clsx from 'clsx'
  import { auth, user } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import Brand from '$lib/components/Brand.svelte'
  import { goto } from '$app/navigation'
  import Form from '$lib/components/Form.svelte'

  let disabled = false
  let showValidation = false
  let values = {
    email: '',
    password: '',
  }

  function handleSubmit(e) {
    if (e.detail.error.state) {
      showValidation = true
      alert.trigger('error', e.detail.error.message)
    } else {
      showValidation = false
      disabled = true
      auth
        .signIn(values.email, values.password)
        .then(async () => {
          await user.loaded()
          goto('/')
        })
        .catch((err) => {
          disabled = false
          alert.trigger('error', err.code, true)
        })
    }
  }
</script>

<Form
  class={clsx('max-w-lg', showValidation && 'show-validation')}
  on:submit={handleSubmit}
>
  <fieldset class="grid gap-2" {disabled}>
    <Brand />
    <h1 class="mt-1 text-2xl font-bold">Sign in</h1>
    <Input
      type="email"
      bind:value={values.email}
      placeholder="Email"
      floating
      required
    />
    <Input
      type="password"
      bind:value={values.password}
      placeholder="Password"
      floating
      required
      autocomplete="current-password"
    />
    <div class="mt-2 flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <a class="link" href="/reset-password">Forgot password?</a>
        <a class="link" href="/signup">Need to sign up?</a>
      </div>
      <button
        class="rounded-md bg-blue-100 px-4 py-2 text-blue-900 shadow-sm transition-colors duration-300 hover:bg-blue-200 disabled:bg-blue-200 disabled:text-blue-500"
        type="submit"
      >
        Sign in
      </button>
    </div>
  </fieldset>
</Form>
