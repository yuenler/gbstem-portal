<script>
  import { gendersJson } from '$lib/data'
  import Select from '$lib/components/Select.svelte'
  let test = 'hi'
  $: console.log(test)
</script>

<div>group</div>
<Select bind:value={test} placeholder="State" options={gendersJson} floating />
