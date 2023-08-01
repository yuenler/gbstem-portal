<script lang="ts">
  import Input from '$lib/components/Input.svelte'
  import clsx from 'clsx'
  import { alert } from '$lib/stores'
  import Brand from '$lib/components/Brand.svelte'
  import { sendPasswordResetEmail } from 'firebase/auth'
  import Form from '$lib/components/Form.svelte'
  import { auth } from '$lib/client/firebase'
  import Link from '$lib/components/Link.svelte'

  let disabled = false
  let showValidation = false
  let values = {
    email: '',
  }
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
  <fieldset class="space-y-4" {disabled}>
    <Brand />
    <h1 class="text-2xl font-bold">Reset password</h1>
    <Input
      type="email"
      bind:value={values.email}
      placeholder="Email"
      floating
      required
    />
    <div class="flex items-center justify-between">
      <span>
        <Link href="/signup">Sign up</Link> or
        <Link href="/signin">sign in</Link>.
      </span>
      <button
        class="rounded-md bg-blue-100 px-4 py-2 text-blue-900 shadow-sm transition-colors duration-300 hover:bg-blue-200"
        type="submit"
      >
        Send email
      </button>
    </div>
  </fieldset>
</Form>
