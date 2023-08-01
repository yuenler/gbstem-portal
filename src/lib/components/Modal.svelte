<script lang="ts">
  import clsx from 'clsx'
  import { createEventDispatcher } from 'svelte'
  import { browser } from '$app/environment'

  let className = ''
  export { className as class }

  const dispatch = createEventDispatcher()
  export let title = ''
  export let size = 'full'
  export let disabled = false
  let openState = false
  $: {
    if (browser) {
      if (openState) {
        document.body.style.position = 'fixed'
        document.body.style.top = `-${window.scrollY}px`
      } else {
        document.body.style.position = ''
        document.body.style.top = ''
      }
    }
  }
  export function open() {
    if (!disabled) {
      openState = true
    }
  }
  export function close() {
    if (!disabled) {
      openState = false
    }
  }
  export function cancel() {
    if (!disabled) {
      openState = false
      dispatch('cancel', true)
    }
  }
  function handleEscape(e: KeyboardEvent) {
    if (openState && !disabled) {
      if (e.code === 'Escape') {
        cancel()
      }
    }
  }
</script>

<svelte:body on:keydown|stopPropagation={handleEscape} />

{#if openState}
  <div
    class="fixed inset-0 z-50 flex h-screen items-center first-letter:w-screen"
    role="dialog"
  >
    <div class={clsx('relative h-full w-full')}>
      <div
        class={clsx(
          'px-d bg-white pb-5',
          size === 'full' && 'absolute top-0 flex h-screen w-screen flex-col',
        )}
      >
        <div
          class="mb-5 flex shrink-0 items-center justify-between border border-black rounded-md p-5 mt-5"
        >
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
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div class={clsx('h-full overflow-hidden overflow-y-auto', className)}>
          <slot />
        </div>
      </div>
    </div>
  </div>
{/if}
