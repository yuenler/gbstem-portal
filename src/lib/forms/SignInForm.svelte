<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames } from '$lib/utils'
  import { createFields, enableErrors, disableErrors, isValid } from '$lib/forms'
  import { auth, user } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import Brand from '$lib/components/Brand.svelte'
  import { goto } from '$app/navigation'

  let formEl
  let disabled = false
  let showValidation = false
  let fields = {
    default: createFields.text('email', 'password')
  }
  function handleSubmit() {
    showValidation = true
    if (isValid(formEl)) {
      disabled = true
      auth
        .signIn(fields.default.email.value, fields.default.password.value)
        .then(async () => {
          fields = disableErrors.allSections(fields)
          await user.loaded()
          goto('/')
        })
        .catch(err => {
          fields = enableErrors.allSections(fields)
          disabled = false
          alert.trigger('error', err.code)
        })
    }
  }
</script>

<form
  class={classNames('w-full max-w-lg', showValidation && 'show-validation')}
  bind:this={formEl}
  on:submit|preventDefault={handleSubmit}
  novalidate
>
  <fieldset class="grid gap-2" {disabled}>
    <Brand />
    <h1 class="mt-1 text-2xl font-bold">Sign in</h1>
    <Input type="email" bind:field={fields.default.email} placeholder="Email" floating required />
    <Input
      type="password"
      bind:field={fields.default.password}
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
</form>
