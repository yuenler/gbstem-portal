<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames } from '$lib/utils'
  import { createFields, enableErrors, disableErrors, clearFields } from '$lib/forms'
  import { user } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import { updatePassword } from 'firebase/auth'
  import Modal from '$lib/components/Modal.svelte'
  import ReauthenticateForm from '$lib/forms/ReauthenticateForm.svelte'

  let modalEl
  let newPasswordEl
  let confirmPasswordEl
  let showValidation = false
  let fields = {
    default: createFields('newPassword', 'confirmPassword')
  }
  function handleSubmit() {
    showValidation = true
    if (newPasswordEl.checkValidity() && confirmPasswordEl.checkValidity()) {
      if (fields.default.newPassword.value === fields.default.confirmPassword.value) {
        fields.default = disableErrors(fields.default)
        modalEl.setOpen(true)
      } else {
        fields.default = enableErrors(fields.default)
        alert.trigger('error', 'Passwords do not match.')
      }
    }
  }
  function handleReauthenticated(reauthenticated) {
    if (reauthenticated) {
      modalEl.setOpen(false)
      updatePassword($user, fields.default.newPassword.value)
        .then(() => {
          showValidation = false
          fields.default = clearFields(fields.default)
          alert.trigger('success', 'Password was successfully changed.')
        })
        .catch(err => {
          alert.trigger('error', err.code)
        })
    }
  }
</script>

<form
  class={classNames('max-w-lg w-full grid', showValidation && 'show-validation')}
  on:submit|preventDefault={handleSubmit}
  novalidate
>
  <div class="grid gap-1">
    <span class="font-bold">Password</span>
    <Input
      type="password"
      bind:self={newPasswordEl}
      bind:field={fields.default.newPassword}
      placeholder="New password"
      floating
      required
    />
    <div class="relative">
      <Input
        class="pr-[5.25rem]"
        type="password"
        bind:self={confirmPasswordEl}
        bind:field={fields.default.confirmPassword}
        placeholder="Confirm password"
        floating
        required
      />
      <div class="absolute top-2 right-2 h-12 flex items-center">
        <button
          class="shadow-sm rounded-md bg-blue-100 px-2 py-1 text-blue-900 hover:bg-blue-200 transition-colors duration-300"
          type="submit"
        >
          Update
        </button>
      </div>
    </div>
  </div>
</form>

<Modal class="flex items-center justify-center" title="Reauthenticate" bind:this={modalEl}>
  <ReauthenticateForm on:reauthenticated={handleReauthenticated} />
</Modal>
