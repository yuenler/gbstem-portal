<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames } from '$lib/utils'
  import { user, db } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import { onMount } from 'svelte'
  import { getDoc, doc, updateDoc } from 'firebase/firestore'
  import { updateProfile } from 'firebase/auth'
  import Form from '$lib/components/Form.svelte'

  let disabled = true
  let showValidation = false
  let values = {
    firstName: '',
    lastName: ''
  }
  onMount(async () => {
    const userDoc = await getDoc(doc($db, 'users', $user.uid))
    const userDocData = userDoc.data()
    values.firstName = userDocData.firstName
    values.lastName = userDocData.lastName
    disabled = false
  })
  function handleSubmit(e) {
    if (e.detail.error.state) {
      showValidation = true
      alert.trigger('error', e.detail.error.message)
    } else {
      showValidation = false
      disabled = true
      const firstName = values.firstName.trim()
      const lastName = values.lastName.trim()
      updateDoc(doc($db, 'users', $user.uid), {
        firstName,
        lastName
      })
        .then(() =>
          updateProfile($user, {
            displayName: `${firstName} ${lastName}`
          }).then(() => {
            disabled = false
            alert.trigger('success', 'Name successfully updated.')
          })
        )
        .catch(err => {
          disabled = false
          alert.trigger('error', err.code, true)
        })
    }
  }
</script>

<Form class={classNames('max-w-lg', showValidation && 'show-validation')} on:submit={handleSubmit}>
  <fieldset {disabled}>
    <span class="font-bold">Name</span>
    <div class="grid gap-2 sm:grid-cols-2">
      <Input type="text" bind:value={values.firstName} placeholder="First name" floating required />
      <div class="flex gap-2">
        <Input type="text" bind:value={values.lastName} placeholder="Last name" floating required />
        <button
          class="mt-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-900 shadow-sm transition-colors duration-300 hover:bg-blue-200 disabled:bg-blue-200 disabled:text-blue-500"
          type="submit"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-6 w-6"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline
              points="17 21 17 13 7 13 7 21"
            />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </button>
      </div>
    </div>
  </fieldset>
</Form>
