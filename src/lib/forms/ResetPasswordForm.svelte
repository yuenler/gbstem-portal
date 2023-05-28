<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames } from '$lib/utils'
  import { auth, user } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import Brand from '$lib/components/Brand.svelte'
  import { sendPasswordResetEmail } from 'firebase/auth'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import Form from '$lib/component/Form.svelte'

  let disabled = false
  let showValidation = false
  let values = {
    email: ''
  }
  let currentUser
  onMount(async () => {
    currentUser = await user.get()
    if (currentUser.signedIn) {
      fields.default.email.value = currentUser.email
    }
  })
  function handleSubmit() {
    if (e.detail.error.state) {
      showValidation = true
      alert.trigger('error', e.detail.error.message)
    } else {
      showValidation = false
      disabled = true
      sendPasswordResetEmail($auth, values.email)
        .then(() => {
          alert.trigger('info', 'Password reset email was sent. Please check your inbox.')
          goto('/signin')
        })
        .catch(err => {
          disabled = false
          alert.trigger('error', err.code, true)
        })
    }
  }
</script>

<Form class={classNames('max-w-lg', showValidation && 'show-validation')} on:submit={handleSubmit}>
  <fieldset {disabled}>
    <Brand />
    <h1 class="mt-1 text-2xl font-bold">Reset password</h1>
    <Input type="email" bind:value={values.email} placeholder="Email" floating required />
    <div
      class={classNames(
        'mt-2 flex items-center',
        currentUser.signedIn ? 'justify-end' : 'justify-between'
      )}
    >
      {#if !currentUser.signedIn}
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
