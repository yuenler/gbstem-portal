<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames } from '$lib/utils'
  import { createFields, getErrorMessage, enableErrors, disableErrors } from '$lib/forms'
  import { auth, user } from '$lib/firebase'
  import { goto } from '$app/navigation'
  import Brand from '$lib/components/Brand.svelte'
  import { alert } from '$lib/stores'

  let emailEl, passwordEl, confirmPasswordEl
  let showValidation = false
  let fields = {
    default: createFields('email', 'password', 'confirmPassword')
  }
  function handleSubmit() {
    showValidation = true
    if (emailEl.checkValidity()) {
      fields.default = disableErrors(fields.default, 'email')
      if (passwordEl.checkValidity()) {
        if (fields.default.password.value === fields.default.confirmPassword.value) {
          auth
            .signUp(fields.default.email.value, fields.default.password.value)
            .then(async () => {
              fields.default = disableErrors(fields.default, 'password', 'confirmPassword')
              await user.loaded()
              goto('/')
            })
            .catch(err => {
              fields.default = enableErrors(fields.default, 'password', 'confirmPassword')
              alert.trigger('error', getErrorMessage(err.code))
            })
        } else {
          fields.default = enableErrors(fields.default, 'password', 'confirmPassword')
          alert.trigger('error', 'Passwords do not match.')
        }
      }
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
  <h1 class="text-2xl mt-1 font-bold">Sign up</h1>
  <Input
    bind:self={emailEl}
    type="email"
    bind:field={fields.default.email}
    placeholder="Email"
    floating
    required
  />
  <Input
    bind:self={passwordEl}
    type="password"
    bind:field={fields.default.password}
    placeholder="New password"
    floating
    required
    autocomplete="new-password"
  />
  <Input
    bind:self={confirmPasswordEl}
    type="password"
    bind:field={fields.default.confirmPassword}
    placeholder="Confirm password"
    floating
    required
    autocomplete="new-password"
  />
  <div class="flex items-center justify-between mt-2">
    <div>
      <a class="link" href="/signin">Need to sign in?</a>
    </div>
    <button
      class="shadow-sm rounded-md bg-blue-100 px-4 py-2 text-blue-900 hover:bg-blue-200 transition-colors duration-300"
      type="submit"
    >
      Sign up
    </button>
    <button
      class="shadow-sm rounded-md bg-red-100 px-4 py-2 text-red-900 hover:bg-red-200 transition-colors duration-300"
      type="button"
      on:click={() => auth.signInWithGoogle()}
    >
      Sign up with Google
    </button>
  </div>
</form>
