<script>
  import PageLayout from '$lib/components/PageLayout.svelte'
  import ApplyForm from '$lib/components/forms/ApplyForm.svelte'
  import { db, user } from '$lib/client/firebase'
  import RegistrationForm from '$lib/components/forms/RegistrationForm.svelte'
</script>

<svelte:head>
  <title>Apply</title>
</svelte:head>

{#if $user?.profile.role === 'instructor'}
  <PageLayout>
    <svelte:fragment slot="title">Apply</svelte:fragment>
    <ApplyForm />
  </PageLayout>
{:else}
  <PageLayout>
    <svelte:fragment slot="title">Register</svelte:fragment>
    <RegistrationForm />
  </PageLayout>
{/if}
