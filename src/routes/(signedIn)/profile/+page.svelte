<script lang="ts">
  import ChangeEmailForm from '$lib/components/forms/ChangeEmailForm.svelte'
  import ChangePasswordForm from '$lib/components/forms/ChangePasswordForm.svelte'
  import DeleteAccountForm from '$lib/components/forms/DeleteAccountForm.svelte'
  import { fade } from 'svelte/transition'
  import { sendEmailVerification } from 'firebase/auth'
  import { alert } from '$lib/stores'
  import ChangeNameForm from '$lib/components/forms/ChangeNameForm.svelte'
  import Card from '$lib/components/Card.svelte'
  import type { PageData } from './$types'
  import { user } from '$lib/client/firebase'

  export let data: PageData

  async function handleVerificationEmail() {
    if ($user) {
      sendEmailVerification($user.object).then(() => {
        alert.trigger('info', 'Verification email was sent.')
      })
    }
  }
</script>

<div class="grid md:grid-cols-2">
  <h1 class="mb-8 text-5xl font-bold md:text-6xl">Profile</h1>
  <div class="flex flex-col items-center gap-6 max-w-2xl">
    {#if !data.user.emailVerified}
      <div
        class="mt-2 flex w-full max-w-lg items-center gap-2 rounded-md bg-red-200 p-3 shadow"
        transition:fade
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 w-6 shrink-0"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <div class="grow">
          Email is not verified. Please check your email and verify to use the
          portal. Can't find it? <button
            class="link"
            type="button"
            on:click={handleVerificationEmail}>Send it again.</button
          >
        </div>
      </div>
    {/if}
    <Card class="grid gap-3">
      <div class="rounded-md bg-gray-100 px-3 py-2 shadow-sm">
        {`HHID: ${data.user.hhid}`}
      </div>
      <div class="text-sm">
        Any problems with changing your profile? Contact us.
      </div>
    </Card>
    <ChangeNameForm />
    <ChangeEmailForm />
    <ChangePasswordForm />
    <DeleteAccountForm />
  </div>
</div>
