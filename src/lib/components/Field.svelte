<script lang="ts">
  import clsx from 'clsx'

  let className = ''
  export { className as class }
</script>

<div class={clsx('rounded-md bg-gray-100 px-3 py-2 shadow-sm', className)}>
  <slot />
</div>
