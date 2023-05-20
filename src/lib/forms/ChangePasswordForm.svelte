<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames } from '$lib/utils'
  import { user } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import { updatePassword } from 'firebase/auth'
  import Modal from '$lib/components/Modal.svelte'
  import ReauthenticateForm from '$lib/forms/ReauthenticateForm.svelte'
  import Form from '$lib/components/Form.svelte'

  let modalEl
  let disabled = false
  let showValidation = false
  let values = {
    newPassword: '',
    confirmPassword: ''
  }
  function handleSubmit(e) {
    if (e.detail.error.state) {
      showValidation = true
      alert.trigger('error', e.detail.error.message)
    } else {
      showValidation = false
      disabled = true
      modalEl.setOpen(true)
    }
  }
  function handleReauthenticated(reauthenticated) {
    if (reauthenticated) {
      modalEl.setOpen(false)
      updatePassword($user, values.newPassword)
        .then(() => {
          disabled = false
          values = {
            newPassword: '',
            confirmPassword: ''
          }
          alert.trigger('success', 'Password was successfully changed.')
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
    <span class="font-bold">Change password</span>
    <Input
      type="password"
      bind:value={values.newPassword}
      placeholder="New password"
      floating
      required
      validation={[[values.newPassword === values.confirmPassword, 'Passwords do not match.']]}
    />
    <div class="relative">
      <Input
        class="pr-[5.25rem]"
        type="password"
        bind:value={values.confirmPassword}
        placeholder="Confirm password"
        floating
        required
        validation={[[values.newPassword === values.confirmPassword, 'Passwords do not match.']]}
      />
      <div class="absolute right-2 top-0 flex h-12 items-center">
        <button
          class="rounded-md bg-blue-100 px-2 py-1 text-blue-900 shadow-sm transition-colors duration-300 hover:bg-blue-200"
          type="submit"
        >
          Update
        </button>
      </div>
    </div>
  </fieldset>
</Form>

<Modal class="flex items-center justify-center" title="Reauthenticate" bind:this={modalEl}>
  <ReauthenticateForm on:reauthenticated={handleReauthenticated} />
</Modal>
