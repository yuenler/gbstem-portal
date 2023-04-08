<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames } from '$lib/utils'
  import { createFields, enableErrors, disableErrors, isValid } from '$lib/forms'
  import { user } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import Brand from '$lib/components/Brand.svelte'
  import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()
  let formEl
  let showValidation = false
  let fields = {
    default: createFields.text('password')
  }
  function handleSubmit() {
    showValidation = true
    if (isValid(formEl)) {
      reauthenticateWithCredential(
        $user,
        EmailAuthProvider.credential($user.email, fields.default.password.value)
      )
        .then(() => {
          fields = disableErrors.allSections(fields)
          dispatch('reauthenticated', true)
        })
        .catch(err => {
          fields = enableErrors.allSections(fields)
          alert.trigger('error', err.code)
        })
    }
  }
</script>

<form
  class={classNames('grid w-full max-w-lg gap-2', showValidation && 'show-validation')}
  bind:this={formEl}
  on:submit|preventDefault={handleSubmit}
  novalidate
>
  <Brand />
  <h1 class="mt-1 text-2xl font-bold">Reauthenticate</h1>
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
    </div>
    <button
      class="rounded-md bg-blue-100 px-4 py-2 text-blue-900 shadow-sm transition-colors duration-300 hover:bg-blue-200"
      type="submit"
    >
      Reauthenticate
    </button>
  </div>
</form>
