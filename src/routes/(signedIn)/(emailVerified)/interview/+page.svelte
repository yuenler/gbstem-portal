<script lang="ts">
    import InterviewForm from "$lib/components/forms/InterviewForm.svelte";
    import PageLayout from "$lib/components/PageLayout.svelte";
</script>

<svelte:head>
  <title>Schedule Your Interview</title>
</svelte:head>

<PageLayout cols={2}>
    <svelte:fragment slot="title">Schedule Your Interview</svelte:fragment>
    <div class="relative w-full">
        <InterviewForm/>
    </div>
</PageLayout>