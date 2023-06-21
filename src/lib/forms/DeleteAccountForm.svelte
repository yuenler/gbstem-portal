<script>
  import { classNames } from '$lib/utils'
  import { user, db } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import { deleteUser } from 'firebase/auth'
  import Modal from '$lib/components/Modal.svelte'
  import Form from '$lib/components/Form.svelte'
  import DeleteAccountReauthenticationForm from './DeleteAccountReauthenticationForm.svelte'
  import { deleteDoc } from 'firebase/firestore'

  let modalEl
  let showValidation = false
  let disabled

  function handleSubmit(e) {
    if (e.detail.error.state) {
      showValidation = true
      alert.trigger('error', e.detail.error.message)
    } else {
      showValidation = false
      disabled = true
      modalEl.open()
    }
  }
  function handleCancel() {
    alert.trigger('info', 'Account deletion canceled.')
  }
  async function handleReauthentication() {
    modalEl.close();
    await deleteDoc(doc($db, 'applications', $user.uid))
    deleteUser(user)
      .then(() => {
        alert.trigger('success', 'Account was successfully deleted.')
      })
      .catch(err => {
        alert.trigger('error', err.code, true)
      })
      .finally(() => {
        disabled = false
      })
  }
</script>

<Modal class="flex items-center justify-center" title="Confirmation" size="full" bind:this={modalEl}>
  <DeleteAccountReauthenticationForm on:confirmed={handleSubmit} />
</Modal>

<!-- Account management form -->
<Form class={classNames('max-w-lg', showValidation && 'show-validation')} on:submit={handleSubmit}>
    <span class="font-bold">Manage account</span>
    <div class="flex justify-end">
        <button
          class="rounded-md bg-red-100 px-2 py-1 text-red-900 shadow-sm transition-colors duration-300 hover:bg-red-200"
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
>  
  <DeleteAccountReauthenticationForm on:reauthenticate={handleReauthentication} />
</Modal>