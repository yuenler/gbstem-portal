<script>
  import { classNames } from '$lib/utils'
  let className = ''
  export { className as class }
</script>

<div class={classNames('w-full rounded-md border border-gray-200 p-4 shadow', className)}>
  {#if $$slots.title}
    <h2 class="text-2xl font-bold">
      <slot name="title" />
    </h2>
  {/if}
  <slot />
</div>
