<script>
  import { fade } from 'svelte/transition'
  import { classNames } from '$lib/utils'
  import { createEventDispatcher } from 'svelte'

  let className
  export { className as class }

  const dispatch = createEventDispatcher()
  export let title = ''
  export let size = 'full'
  let openState = false
  export function open() {
    openState = true
  }
  export function close() {
    openState = false
  }
  export function cancel() {
    openState = false
    dispatch('cancel', true)
  }
  function handleKeyDown(e) {
    if (e.code === 'Escape') {
      cancel()
    }
  }
</script>

{#if openState}
  <div
    class="fixed left-0 top-0 z-50 flex h-screen items-center first-letter:w-screen"
    transition:fade={{ duration: 150 }}
    on:keydown|stopPropagation={handleKeyDown}
  >
    <div class="relative h-full w-full">
      <div
        class={classNames(
          'px-dynamic bg-white pb-5',
          size === 'full' && 'absolute top-0 flex h-screen w-screen flex-col'
        )}
      >
        <div class="mb-5 flex shrink-0 items-center justify-between border-b border-gray-300 py-5">
          <h1 class="text-xl uppercase">{title}</h1>
          <button class="shrink-0" type="button" on:click={cancel}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="h-8 w-8"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class={classNames('h-full overflow-hidden overflow-y-auto', className)}>
          <slot />
        </div>
      </div>
    </div>
  </div>
{/if}
