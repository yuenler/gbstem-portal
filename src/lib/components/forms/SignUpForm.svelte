<script lang="ts">
  import Input from '$lib/components/Input.svelte'
  import { goto } from '$app/navigation'
  import Brand from '$lib/components/Brand.svelte'
  import { alert } from '$lib/stores'
  import { doc, getDoc, setDoc } from 'firebase/firestore'
  import { customAlphabet } from 'nanoid'
  import Form from '$lib/components/Form.svelte'
  import {
    createUserWithEmailAndPassword,
    deleteUser,
    updateProfile,
  } from 'firebase/auth'
  import { auth, db } from '$lib/client/firebase'
  import Link from '../Link.svelte'
  import Button from '../Button.svelte'
  import Loading from '../Loading.svelte'
  import { cn } from '$lib/utils'
  import Select from '../Select.svelte'

  let disabled = false
  let showValidation = false
  let values = {
    role: '',
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
                try {
                  const res = await getDoc(doc(db, 'hhids', hhid))
                  if (res.exists()) {
                    hhid = generateId()
                    if (i == 4) {
                      hhid = ''
                    }
                  } else {
                    break
                  }
                } catch (err) {
                  hhid = ''
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
                      user.getIdToken().then((idToken) => {
                        fetch('/api/auth', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ idToken }),
                        })
                          .then(() => {
                            fetch('/api/action', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                type: 'verifyEmail',
                                email: values.email,
                              }),
                            }).then(async (res) => {
                              if (!res.ok) {
                                const { message } = await res.json()
                                console.log(message)
                              }
                              disabled = false
                              goto('/profile')
                            })
                          })
                          .catch((err) => {
                            console.log('Sign In Error:', err)
                            disabled = false
                          })
                      })
                    })
                  })
                  .catch((err) => {
                    console.log(err)
                    disabled = false
                  })
              }
            })
            .catch((err) => {
              console.log(err)
              disabled = false
            })
        })
        .catch((err) => {
          alert.trigger('error', err.code, true)
          disabled = false
        })
    } else {
      showValidation = true
      alert.trigger('error', e.detail.error)
    }
  }
</script>

<Form
  class={cn('max-w-lg', showValidation && 'show-validation')}
  on:submit={handleSubmit}
>
  <fieldset class="space-y-4" {disabled}>
    <strong>Website under construction. Please come back later.</strong>
  </fieldset>
</Form>
