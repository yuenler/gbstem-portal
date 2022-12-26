<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames, createFields } from '$lib/utils'
  import { auth, user } from '$lib/firebase'
  import { alert } from '$lib/stores'
  import { goto } from '$app/navigation'
  import { verifyBeforeUpdateEmail } from 'firebase/auth'

  let newEmailEl
  let showValidation = false
  let fields = {
    default: createFields('newEmail')
  }
  function handleSubmit() {
    showValidation = true
    if (newEmailEl.checkValidity()) {
      fields.default.newEmail.error = false
      verifyBeforeUpdateEmail($user, fields.default.newEmail.value)
        .then(() => {
          showValidation = false
          alert.trigger('info', 'A verification email was sent.')
        })
        .catch(error => {
          console.log(error)
          alert.trigger('error', 'Something went wrong.')
        })
    } else {
      fields.default.newEmail.error = true
    }
  }
</script>

<form
  class={classNames('w-full grid', showValidation && 'show-validation')}
  on:submit|preventDefault={handleSubmit}
  novalidate
>
  <div class="grid gap-1">
    <span class="font-bold">Email</span>
    <Input
      type="email"
      field={{
        value: $user.email,
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
