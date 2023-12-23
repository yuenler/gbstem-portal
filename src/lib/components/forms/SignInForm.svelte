<script lang="ts">
  import Input from '$lib/components/Input.svelte'
  import { auth } from '$lib/client/firebase'
  import { alert } from '$lib/stores'
  import Brand from '$lib/components/Brand.svelte'
  import Form from '$lib/components/Form.svelte'
  import { signInWithEmailAndPassword } from 'firebase/auth'
  import { goto } from '$app/navigation'
  import Link from '../Link.svelte'
  import Button from '../Button.svelte'
  import { cn } from '$lib/utils'

  let disabled = false
  let showValidation = false
  let values = {
    email: '',
    password: '',
  }

  function handleSubmit(e: CustomEvent<SubmitData>) {
    if (e.detail.error === null) {
      showValidation = false
      disabled = true
      signInWithEmailAndPassword(auth, values.email, values.password)
        .then((credential) => {
          credential.user.getIdToken().then((idToken) => {
            fetch('/api/auth', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ idToken }),
            })
              .then(() => {
                goto('/profile')
              })
              .catch((err) => console.log('Sign In Error:', err))
          })
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
  class={cn('max-w-lg', showValidation && 'show-validation')}
  on:submit={handleSubmit}
>
  <fieldset class="space-y-4" {disabled}>
    <strong>Website under construction. Please come back later.</strong>
  </fieldset>
</Form>
