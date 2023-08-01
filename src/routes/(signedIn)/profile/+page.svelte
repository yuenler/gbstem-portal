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
  import PageLayout from '$lib/components/PageLayout.svelte'
  import Field from '$lib/components/Field.svelte'

  export let data: PageData

  async function handleVerificationEmail() {
    if ($user) {
      sendEmailVerification($user.object).then(() => {
        alert.trigger('info', 'Verification email was sent.')
      })
    }
  }
</script>

<svelte:head>
  <title>Profile</title>
</svelte:head>

<PageLayout>
  <svelte:fragment slot="title">Profile</svelte:fragment>
  <div class="max-w-2xl grid gap-6 w-full">
    {#if !data.user.emailVerified}
      <div
        class="mt-2 flex w-full items-center gap-4 rounded-md bg-red-200 px-5 py-4 shadow"
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
          Email is not verified. Try reloading or check your inbox to verify
          your account. Can't find the email? <button
            class="link"
            type="button"
            on:click={handleVerificationEmail}>Send it again.</button
          >
        </div>
      </div>
    {/if}
    <Card class="space-y-3">
      <Field>
        {`HHID: ${$user ? $user.profile.hhid : ''}`}
      </Field>
      <div class="text-sm">
        Any problems with changing your profile? Contact us at <a
          href="mailto:team@hackharvard.io"
          class="link">team@hackharvard.io</a
        >.
      </div>
    </Card>
    <ChangeNameForm />
    <ChangeEmailForm />
    <ChangePasswordForm />
    <DeleteAccountForm />
  </div>
</PageLayout>
