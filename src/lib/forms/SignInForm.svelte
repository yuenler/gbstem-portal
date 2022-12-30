<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames, createFields } from '$lib/utils'
  import { auth, user } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import Brand from '../components/Brand.svelte'
  import { goto } from '$app/navigation'
  import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()
  let emailEl
  let showValidation = false
  let fields = {
    default: createFields('email', 'password')
  }
  function handleSubmit() {
    showValidation = true
    if (emailEl.checkValidity()) {
      fields.default.email.error = false
      if ($user) {
        reauthenticateWithCredential(
          $user,
          EmailAuthProvider.credential(fields.default.email.value, fields.default.password.value)
        )
          .then(() => {
            dispatch('reauthenticated', true)
          })
          .catch(() => {
            Object.keys(fields.default).forEach(element => {
              fields.default[element].error = true
            })
            alert.trigger('error', 'Incorrect credentials.')
          })
      } else {
        auth
          .signIn(fields.default.email.value, fields.default.password.value)
          .then(() => {
            goto('/')
          })
          .catch(() => {
            Object.keys(fields.default).forEach(element => {
              fields.default[element].error = true
            })
            alert.trigger('error', 'Incorrect credentials.')
          })
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
