<script lang="ts">
  import { alert } from '$lib/stores'
  import clsx from 'clsx'
  import { navigating } from '$app/stores'
  import { fade } from 'svelte/transition'
  import { onMount } from 'svelte'

  let timer: number | undefined
  let visible = false
  $: if ($navigating) {
    if (visible) {
      close()
    }
  }
  onMount(() => {
    return alert.subscribe((alert) => {
      if (alert !== null) {
        if (visible) {
          clearTimeout(timer)
        } else {
          visible = true
        }
        setCloseTimeout()
      }
    })
  })
  function setCloseTimeout() {
    timer = window.setTimeout(() => {
      close()
    }, 3000)
  }
  function close() {
    clearTimeout(timer)
    timer = undefined
    alert.clear()
  }
  function handleEscape(e: KeyboardEvent) {
    if (e.code === 'Escape') {
      close()
    }
  }
</script>

<svelte:document on:keydown={visible ? handleEscape : undefined} />
{#if visible}
  <button
    type="button"
    class="h-min-content fixed bottom-3 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full mx-3"
    transition:fade
    on:click={close}
  >
    <div
      class={clsx(
        'flex w-full items-center gap-2 rounded-md p-3 shadow',
        $alert.type === 'success' && 'bg-green-200',
        $alert.type === 'info' && 'bg-gray-200',
        $alert.type === 'error' && 'bg-red-200',
      )}
    >
      {#if $alert.type === 'success'}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 w-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      {:else if $alert.type === 'info'}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 w-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
      {:else if $alert.type === 'error'}
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
      {/if}
      <div class="grow text-left">{$alert.message}</div>
    </div>
  </button>
{/if}
