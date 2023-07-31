<script lang="ts">
  import Input from '$lib/components/Input.svelte'
  import clsx from 'clsx'
  import { goto } from '$app/navigation'
  import Brand from '$lib/components/Brand.svelte'
  import { alert } from '$lib/stores'
  import { doc, getDoc, setDoc } from 'firebase/firestore'
  import { customAlphabet } from 'nanoid'
  import Form from '$lib/components/Form.svelte'
  import {
    createUserWithEmailAndPassword,
    deleteUser,
    sendEmailVerification,
    updateProfile,
  } from 'firebase/auth'
  import { auth, db } from '$lib/client/firebase'

  let disabled = false
  let showValidation = false
  let values = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  }
  function generateId() {
    const alphabet = '0123456789'
    const nanoid = customAlphabet(alphabet, 7)
    return 'HH-' + nanoid()
  }
  function handleSubmit(e: CustomEvent<SubmitData>) {
    if (e.detail.error === null) {
      // remove later
      const validEmails = [
        'yuenlerchow@college.harvard.edu',
        'lerchow@gmail.com',
        'dseum@college.harvard.edu',
        'dseum@gmail.com',
        'jooeunjunelee@college.harvard.edu',
        'nathanli@college.harvard.edu',
        'edwardkang@college.harvard.edu',
        'testing@hackharvard.io',
        'dseum@college.harvard.edu',
        'vcainamisir@college.harvard.edu',
        'kharvey@college.harvard.edu',
        'hzhang1@college.harvard.edu',
      ]
      if (!validEmails.includes(values.email)) {
        alert.trigger(
          'error',
          'Account creation temporarily restricted to HackHarvard board members.',
        )
        return
      }

      // actual
      showValidation = false
      disabled = true
      const firstName = values.firstName.trim()
      const lastName = values.lastName.trim()
      createUserWithEmailAndPassword(auth, values.email, values.password)
        .then(({ user }) => {
          updateProfile(user, {
            displayName: `${firstName} ${lastName}`,
          })
            .then(async () => {
              // attempt to generate hhid
              let hhid = generateId()
              for (let i = 0; i < 5; ++i) {
                const res = await getDoc(doc(db, 'hhids', hhid))
                if (res.exists()) {
                  hhid = generateId()
                  if (i == 4) {
                    hhid = ''
                  }
                } else {
                  break
                }
              }
              if (hhid === '') {
                alert.trigger(
                  'error',
                  'HHID could not be generated. Contact admin and create a new account.',
                )
                deleteUser(user)
              } else {
                setDoc(doc(db, 'hhids', hhid), {})
                  .then(() => {
                    setDoc(doc(db, 'users', user.uid), {
                      hhid,
                      role: 'applicant',
                      firstName,
                      lastName,
                    }).then(() => {
                      sendEmailVerification(user)
                        .then(() => {
                          user.getIdToken().then((idToken) => {
                            fetch('/api/auth', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ idToken }),
                            }).catch((err) =>
                              console.log('Sign In Error:', err),
                            )
                          })
                        })
                        .catch((err) =>
                          alert.trigger(
                            'error',
                            'Please manually verify email through your profile.',
                          ),
                        )
                    })
                  })
                  .catch((err) => console.log(err))
              }
            })
            .catch((err) => console.log(err))
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
  class={clsx('max-w-lg', showValidation && 'show-validation')}
  on:submit={handleSubmit}
>
  <fieldset class="grid gap-2" {disabled}>
    <Brand />
    <h1 class="mt-1 text-2xl font-bold">Sign up</h1>
    <div class="grid gap-2 sm:grid-cols-2 sm:gap-4">
      <Input
        type="text"
        bind:value={values.firstName}
        placeholder="First name"
        floating
        required
      />
      <Input
        type="text"
        bind:value={values.lastName}
        placeholder="Last name"
        floating
        required
      />
    </div>
    <Input
      type="email"
      bind:value={values.email}
      placeholder="Email"
      floating
      required
    />
    <Input
      type="password"
      bind:value={values.password}
      placeholder="Password"
      floating
      required
      autocomplete="new-password"
    />
    <Input
      type="password"
      bind:value={values.confirmPassword}
      placeholder="Confirm password"
      floating
      required
      autocomplete="new-password"
      validations={[
        [values.password !== values.confirmPassword, 'Passwords do not match.'],
      ]}
    />
    <div class="mt-2 flex items-center justify-between">
      <div>
        <a class="link" href="/signin">Need to sign in?</a>
      </div>
      <button
        class="rounded-md bg-blue-100 px-4 py-2 text-blue-900 shadow-sm transition-colors duration-300 hover:bg-blue-200 disabled:bg-blue-200 disabled:text-blue-500"
        type="submit"
      >
        Sign up
      </button>
    </div>
  </fieldset>
</Form>
