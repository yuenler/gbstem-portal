<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames, createFields } from '$lib/utils'
  import { auth } from '$lib/firebase'
  import { goto } from '$app/navigation'
  import Brand from '../components/Brand.svelte'
  import { alert } from '$lib/stores'

  let emailEl, passwordEl, confirmPasswordEl
  let showValidation = false
  let fields = {
    default: createFields('email', 'password', 'confirmPassword')
  }
  function handleSubmit() {
    showValidation = true
    if (emailEl.checkValidity()) {
      fields.default.email.error = false
      if (
        passwordEl.checkValidity() &&
        fields.default.password.value === fields.default.confirmPassword.value
      ) {
        auth
          .signUp(fields.default.email.value, fields.default.password.value)
          .then(() => {
            goto('/')
          })
          .catch(err => {
            if (err.code === 'auth/weak-password') {
              alert.trigger('error', 'Password should be at least 6 characters.')
            } else {
              console.log(err)
            }
          })
      } else {
        fields.default.password.error = true
        fields.default.confirmPassword.error = true
      }
    } else {
      fields.default.email.error = true
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
