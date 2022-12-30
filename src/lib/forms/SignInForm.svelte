<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames } from '$lib/utils'
  import { createFields, enableErrors, disableErrors, getErrorMessage } from '$lib/forms'
  import { auth, user } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import Brand from '$lib/components/Brand.svelte'
  import { goto } from '$app/navigation'

  let emailEl
  let showValidation = false
  let fields = {
    default: createFields('email', 'password')
  }
  function handleSubmit() {
    showValidation = true
    if (emailEl.checkValidity()) {
      fields.default = disableErrors(fields.default, 'email')
      auth
        .signIn(fields.default.email.value, fields.default.password.value)
        .then(async () => {
          fields.default = disableErrors(fields.default)
          await user.loaded()
          goto('/')
        })
        .catch(err => {
          fields.default = enableErrors(fields.default)
          alert.trigger('error', getErrorMessage(err.code))
        })
    } else {
      fields.default = enableErrors(fields.default, 'email')
    }
  }
</script>

<form
  class={classNames('max-w-lg w-full grid gap-2', showValidation && 'show-validation')}
  on:submit|preventDefault={handleSubmit}
  novalidate
>
  <Brand />
  <h1 class="text-2xl mt-1 font-bold">Sign in</h1>
  <Input
    bind:self={emailEl}
    type="email"
    bind:field={fields.default.email}
    placeholder="Email"
    floating
    required
  />
  <Input
    type="password"
    bind:field={fields.default.password}
    placeholder="Password"
    floating
    required
    autocomplete="current-password"
  />
  <div class="flex items-center justify-between mt-2">
    <div class="flex flex-col gap-1">
      <a class="link" href="/forgot-password">Forgot password?</a>
      <a class="link" href="/signup">Need to sign up?</a>
    </div>
    <button
      class="shadow-sm rounded-md bg-blue-100 px-4 py-2 text-blue-900 hover:bg-blue-200 transition-colors duration-300"
      type="submit"
    >
      Sign in
    </button>
    <button
      class="shadow-sm rounded-md bg-red-100 px-4 py-2 text-red-900 hover:bg-red-200 transition-colors duration-300"
      type="button"
      on:click={() => auth.signInWithGoogle()}
    >
      Sign in with Google
    </button>
  </div>
</form>
