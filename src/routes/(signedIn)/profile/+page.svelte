<script lang="ts">
  import ChangeEmailForm from '$lib/components/forms/ChangeEmailForm.svelte'
  import ChangePasswordForm from '$lib/components/forms/ChangePasswordForm.svelte'
  import DeleteAccountForm from '$lib/components/forms/DeleteAccountForm.svelte'
  import { fade } from 'svelte/transition'
  import { alert } from '$lib/stores'
  import ChangeNameForm from '$lib/components/forms/ChangeNameForm.svelte'
  import Card from '$lib/components/Card.svelte'
  import type { PageData } from './$types'
  import { user } from '$lib/client/firebase'
  import PageLayout from '$lib/components/PageLayout.svelte'
  import Field from '$lib/components/Field.svelte'
  import Dialog from '$lib/components/Dialog.svelte'
  import Button from '$lib/components/Button.svelte'
  import DialogActions from '$lib/components/DialogActions.svelte'
  import QRious from 'qrious'
  import { onMount } from 'svelte'
  import Link from '$lib/components/Link.svelte'

  export let data: PageData

  let dialogEl: Dialog
  let disabled = false

  onMount(() => {
    return user.subscribe((user) => {
      new QRious({
        element: document.getElementById('qr'),
        value: `https://admin.gbstem.org/user/${
          $user ? $user.profile.hhid : ''
        }`,
        size: 200,
      })
    })
  })

  async function handleVerificationEmail() {
    if ($user) {
      disabled = true
      fetch('/api/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'verifyEmail',
        }),
      }).then(async (res) => {
        if (res.ok) {
          alert.trigger('info', 'Verification email was sent.')
        } else {
          const { message } = await res.json()
          console.log(message)
          alert.trigger('error', message)
        }
        disabled = false
      })
    }
  }
</script>

<svelte:head>
  <title>Profile</title>
</svelte:head>

<PageLayout>
  <strong>Website under construction. Please come back later.</strong>
</PageLayout>
