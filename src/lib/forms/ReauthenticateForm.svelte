<script>
  import Input from '$lib/components/Input.svelte'
  import clsx from 'clsx'
  import { user } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import Brand from '$lib/components/Brand.svelte'
  import {
    EmailAuthProvider,
    reauthenticateWithCredential,
  } from 'firebase/auth'
  import { createEventDispatcher } from 'svelte'
  import Form from '$lib/components/Form.svelte'

  const dispatch = createEventDispatcher()
  let disabled = false
  let showValidation = false
  let values = {
    password: '',
  }
  function handleSubmit(e) {
    if (e.detail.error.state) {
      showValidation = true
      alert.trigger('error', e.detail.error.message)
    } else {
      showValidation = false
      disabled = true
      reauthenticateWithCredential(
        $user,
        EmailAuthProvider.credential($user.email, values.password)
      )
        .then(() => {
          dispatch('reauthenticate', true)
        })
        .catch((err) => {
          disabled = false
          alert.trigger('error', err.code, true)
        })
    }
  }
</script>

<Form
  class={clsx(
    'grid w-full max-w-lg gap-2',
    showValidation && 'show-validation'
  )}
  on:submit={handleSubmit}
>
  <fieldset {disabled}>
    <Brand />
    <h1 class="mt-1 text-2xl font-bold">Reauthenticate</h1>
    <Input
      type="password"
      bind:value={values.password}
      placeholder="Password"
      floating
      required
      autocomplete="current-password"
      focus
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
  </fieldset>
</Form>
