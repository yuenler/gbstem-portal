<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames } from '$lib/utils'
  import {
    createFields,
    enableErrors,
    disableErrors,
    getErrorMessage,
    clearFields
  } from '$lib/forms'
  import { user } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import { verifyBeforeUpdateEmail } from 'firebase/auth'
  import Modal from '$lib/components/Modal.svelte'
  import ReauthenticateForm from '$lib/forms/ReauthenticateForm.svelte'

  let modalEl
  let newEmailEl
  let showValidation = false
  let fields = {
    default: createFields('newEmail')
  }
  function handleSubmit() {
    showValidation = true
    if (newEmailEl.checkValidity()) {
      fields.default = disableErrors(fields.default)
      modalEl.setOpen(true)
    } else {
      fields.default = enableErrors(fields.default)
    }
  }
  function handleReauthenticated(reauthenticated) {
    if (reauthenticated) {
      modalEl.setOpen(false)
      verifyBeforeUpdateEmail($user, fields.default.newEmail.value)
        .then(() => {
          showValidation = false
          fields.default = clearFields(fields.default)
          alert.trigger('info', 'A verification email was sent.')
        })
        .catch(err => {
          alert.trigger('error', getErrorMessage(err.code))
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
    <span class="font-bold">Email</span>
    <Input
      type="email"
      field={{
        value: $user ? $user.email : '',
        error: false
      }}
      placeholder="Current email"
      floating
      readonly
    />
    <div class="relative">
      <Input
        class="pr-[5.25rem]"
        bind:self={newEmailEl}
        type="email"
        bind:field={fields.default.newEmail}
        placeholder="New email"
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
