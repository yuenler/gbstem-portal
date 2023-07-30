<script>
  import clsx from 'clsx'
  import { user, db, storage } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import {
    EmailAuthProvider,
    deleteUser,
    reauthenticateWithCredential,
  } from 'firebase/auth'
  import Modal from '$lib/components/Modal.svelte'
  import Form from '$lib/components/Form.svelte'
  import Brand from '$lib/components/Brand.svelte'
  import Input from '$lib/components/Input.svelte'
  import { doc, deleteDoc, getDoc } from 'firebase/firestore'
  import { ref, deleteObject } from 'firebase/storage'

  let modalEl
  let showValidation = false
  let disabled = false
  let values = {
    password: '',
  }

  function handleSubmit(e) {
    if (e.detail.error.state) {
      showValidation = true
      alert.trigger('error', e.detail.error.message)
    } else {
      showValidation = false
      modalEl.open()
    }
  }
  function handleCancel() {
    alert.trigger('info', 'Account deletion canceled.')
  }
  async function handleReauthenticate(e) {
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
        .then(async () => {
          getDoc(doc($db, 'users', $user.uid)).then(async (res) => {
            const profile = res.data()
            const hhid = profile.hhid
            await storage.loaded()
            const resumeRef = ref($storage, `resumes/${$user.uid}.pdf`)
            deleteObject(resumeRef).catch()
            deleteDoc(doc($db, 'applications', $user.uid)).catch()
            Promise.all([
              deleteDoc(doc($db, 'hhids', hhid)),
              deleteDoc(doc($db, 'users', $user.uid)),
            ])
              .then(() => {
                deleteUser($user)
                  .then(() => {
                    alert.trigger(
                      'success',
                      'Account was successfully deleted.'
                    )
                    location.reload()
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
        })
        .catch((err) => {
          disabled = false
          alert.trigger('error', err.code, true)
        })
    }
  }
</script>

<Form
  class={clsx('max-w-lg', showValidation && 'show-validation')}
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
    class={clsx(
      'grid w-full max-w-lg gap-2',
      showValidation && 'show-validation'
    )}
    on:submit={handleReauthenticate}
  >
    <fieldset {disabled}>
      <Brand />
      <h1 class="mt-1 text-2xl font-bold">Delete account</h1>
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
          class="rounded-md bg-red-100 px-4 py-2 text-red-900 shadow-sm transition-colors duration-300 hover:bg-red-200"
          type="submit"
        >
          Delete
        </button>
      </div>
    </fieldset>
  </Form>
</Modal>
