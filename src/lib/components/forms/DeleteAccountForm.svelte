<script lang="ts">
  import clsx from 'clsx'
  import { alert } from '$lib/stores'
  import {
    EmailAuthProvider,
    deleteUser,
    reauthenticateWithCredential,
  } from 'firebase/auth'
  import Modal from '$lib/components/Modal.svelte'
  import Form from '$lib/components/Form.svelte'
  import Input from '$lib/components/Input.svelte'
  import { doc, deleteDoc } from 'firebase/firestore'
  import { ref, deleteObject } from 'firebase/storage'
  import { db, storage, user } from '$lib/client/firebase'

  let className = ''
  export { className as class }

  let modalEl: Modal
  let showValidation = false
  let disabled = false
  let values = {
    password: '',
  }

  function handleSubmit(e: CustomEvent<SubmitData>) {
    if (e.detail.error === null) {
      showValidation = false
      modalEl.open()
    } else {
      showValidation = true
      alert.trigger('error', e.detail.error)
    }
  }
  function handleCancel() {
    alert.trigger('info', 'Account deletion canceled.')
  }
  async function handleReauthenticate(e: CustomEvent<SubmitData>) {
    if ($user) {
      const frozenUser = $user
      if (e.detail.error === null) {
        showValidation = false
        disabled = true
        reauthenticateWithCredential(
          frozenUser.object,
          EmailAuthProvider.credential(
            frozenUser.object.email as string,
            values.password,
          ),
        )
          .then(async () => {
            const hhid = frozenUser.profile.hhid
            const resumeRef = ref(
              storage,
              `resumes/${frozenUser.object.uid}.pdf`,
            )
            deleteObject(resumeRef).catch()
            deleteDoc(doc(db, 'applications', frozenUser.object.uid)).catch()
            Promise.all([
              deleteDoc(doc(db, 'hhids', hhid)),
              deleteDoc(doc(db, 'frozenUsers', frozenUser.object.uid)),
            ])
              .then(() => {
                deleteUser(frozenUser.object)
                  .then(() => {
                    alert.trigger(
                      'success',
                      'Account was successfully deleted.',
                    )
                    window.setTimeout(() => {
                      location.reload()
                    }, 3000)
                  })
                  .catch((err) => {
                    console.log(err)
                    disabled = false
                  })
              })
              .catch((err) => {
                console.log(err)
                disabled = false
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
  }
</script>

<Form
  class={clsx(showValidation && 'show-validation', className)}
  on:submit={handleSubmit}
>
  <span class="font-bold">Delete account</span>
  <div class="mt-2">
    <button
      class="rounded-md bg-red-100 px-4 py-2 text-red-900 shadow-sm transition-colors duration-300 hover:bg-red-200 disabled:bg-red-200 disabled:text-red-500"
      type="submit"
    >
      Delete account
    </button>
  </div>
</Form>

<Modal
  class="flex items-center justify-center"
  title="Delete account"
  bind:this={modalEl}
  on:cancel={handleCancel}
  {disabled}
>
  <Form
    class={clsx('max-w-lg', showValidation && 'show-validation')}
    on:submit={handleReauthenticate}
  >
    <fieldset class="space-y-4" {disabled}>
      <h1 class="text-2xl font-bold">Delete account</h1>
      <Input
        type="password"
        bind:value={values.password}
        placeholder="Password"
        floating
        required
        autocomplete="current-password"
        focus
      />
      <div class="flex items-center justify-between">
        <span class="font-bold">Warning! This is irreversible.</span>
        <button
          class="rounded-md bg-red-100 px-4 py-2 text-red-900 shadow-sm transition-colors duration-300 hover:bg-red-200"
          type="submit"
        >
          Delete
        </button>
      </div>
    </fieldset>
  </Form>
</Modal>
