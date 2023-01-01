<script>
  import Input from '$lib/components/Input.svelte'
  import { classNames } from '$lib/utils'
  import { createFields, getErrorMessage, enableErrors, disableErrors } from '$lib/forms'
  import { auth, user, db } from '$lib/firebase'
  import { goto } from '$app/navigation'
  import Brand from '$lib/components/Brand.svelte'
  import { alert } from '$lib/stores'
  import { doc, setDoc } from 'firebase/firestore'

  let emailEl, passwordEl, confirmPasswordEl, firstNameEl, lastNameEl
  let disabled = false
  let showValidation = false
  let fields = {
    default: createFields('email', 'password', 'confirmPassword')
  }
  function handleSubmit() {
    showValidation = true
    if (emailEl.checkValidity()) {
      fields.default = disableErrors(fields.default, 'email')
      if (passwordEl.checkValidity()) {
        if (fields.default.password.value === fields.default.confirmPassword.value) {
          disabled = true
          auth
            .signUp(
              fields.default.firstName.value,
              fields.default.email.value,
              fields.default.password.value
            )
            .then(async () => {
              await user.loaded()
              setDoc(doc($db, 'users', $user.uid), {
                hhid: Math.floor(Math.random() * 100000000),
                role: 'applicant',
                firstName: fields.default.firstName.value,
                lastName: fields.default.lastName.value
              }).then(() => {
                goto('/')
              })
            })
            .catch(err => {
              fields.default = enableErrors(fields.default, 'password', 'confirmPassword')
              disabled = false
              alert.trigger('error', getErrorMessage(err.code))
            })
        } else {
          fields.default = enableErrors(fields.default, 'password', 'confirmPassword')
          alert.trigger('error', 'Passwords do not match.')
        }
      }
    } else {
      fields.default = enableErrors(fields.default, 'email')
    }
  }
</script>

<form
  class={classNames('max-w-lg w-full', showValidation && 'show-validation')}
  on:submit|preventDefault={handleSubmit}
  novalidate
>
  <fieldset class="grid gap-2" {disabled}>
    <Brand />
    <h1 class="text-2xl mt-1 font-bold">Sign up</h1>
    <Input
      bind:self={firstNameEl}
      type="text"
      bind:field={fields.default.firstName}
      placeholder="First name"
      floating
      required
    />
    <Input
      bind:self={lastNameEl}
      type="text"
      bind:field={fields.default.lastName}
      placeholder="Last name"
      floating
      required
    />

    <Input
      bind:self={emailEl}
      type="email"
      bind:field={fields.default.email}
      placeholder="Email"
      floating
      required
    />
    <Input
      bind:self={passwordEl}
      type="password"
      bind:field={fields.default.password}
      placeholder="New password"
      floating
      required
      autocomplete="new-password"
    />
    <Input
      bind:self={confirmPasswordEl}
      type="password"
      bind:field={fields.default.confirmPassword}
      placeholder="Confirm password"
      floating
      required
      autocomplete="new-password"
    />
    <div class="flex items-center justify-between mt-2">
      <div>
        <a class="link" href="/signin">Need to sign in?</a>
      </div>
      <button
        class="shadow-sm rounded-md bg-blue-100 px-4 py-2 text-blue-900 hover:bg-blue-200 transition-colors duration-300 disabled:text-blue-500 disabled:bg-blue-200"
        type="submit"
      >
        Sign up
      </button>
    </div>
  </fieldset>
</form>
