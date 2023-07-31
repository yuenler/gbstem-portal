<script>
  import ApplyForm from '$lib/components/forms/ApplyForm.svelte'
</script>

<svelte:head>
  <title>Apply</title>
</svelte:head>

<div class="grid md:grid-cols-3">
  <h1 class="mb-8 text-5xl font-bold md:text-6xl">Apply</h1>
  <div class="md:col-span-2 flex flex-col items-center gap-6">
    <ApplyForm />
  </div>
</div>
