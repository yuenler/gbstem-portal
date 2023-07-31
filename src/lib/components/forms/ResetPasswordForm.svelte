<script lang="ts">
  import Input from '$lib/components/Input.svelte'
  import clsx from 'clsx'
  import { alert } from '$lib/stores'
  import Brand from '$lib/components/Brand.svelte'
  import { sendPasswordResetEmail } from 'firebase/auth'
  import { goto } from '$app/navigation'
  import Form from '$lib/components/Form.svelte'
  import { auth, user } from '$lib/client/firebase'
  import { onMount } from 'svelte'

  let disabled = false
  let showValidation = false
  let values = {
    email: '',
  }
  let signedIn: boolean
  onMount(() => {
    return user.subscribe((user) => {
      if (user) {
        signedIn = true
        values.email = user.object.email as string
      } else if ($user === null) {
        signedIn = false
      }
    })
  })
  function handleSubmit(e: CustomEvent<SubmitData>) {
    if (e.detail.error === null) {
      showValidation = false
      disabled = true
      sendPasswordResetEmail(auth, values.email)
        .then(() => {
          alert.trigger(
            'info',
            'Password reset email was sent. Please check your inbox.',
          )
          goto('/signin')
        })
        .catch((err) => {
          disabled = false
          alert.trigger('error', err.code, true)
        })
    } else {
      showValidation = true
      alert.trigger('error', e.detail.error)
    }
  }
</script>

<Form
  class={clsx('max-w-lg', showValidation && 'show-validation')}
  on:submit={handleSubmit}
>
  <fieldset {disabled}>
    <Brand />
    <h1 class="mt-1 text-2xl font-bold">Reset password</h1>
    <Input
      type="email"
      bind:value={values.email}
      placeholder="Email"
      floating
      required
    />
    <div
      class={clsx(
        'mt-2 flex items-center',
        signedIn ? 'justify-end' : 'justify-between',
      )}
    >
      {#if !signedIn}
        <span>
          <a class="link" href="/signup">Sign up</a> or
          <a class="link" href="/signin">sign in</a>.
        </span>
      {/if}
      <button
        class="rounded-md bg-blue-100 px-4 py-2 text-blue-900 shadow-sm transition-colors duration-300 hover:bg-blue-200"
        type="submit"
      >
        Send email
      </button>
    </div>
  </fieldset>
</Form>
