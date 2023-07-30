<script>
  import { alert } from '$lib/stores'
  import clsx from 'clsx'
  import { navigating } from '$app/stores'
  import { fade } from 'svelte/transition'

  let timer
  $: bgColor =
    $alert.type === ''
      ? ''
      : {
          success: 'bg-green-200',
          info: 'bg-gray-200',
          error: 'bg-red-200',
        }[$alert.type]
  $: if ($navigating && timer) {
    closeAlert()
  }
  $: if ($alert.type !== '' && !timer) {
    timer = window.setTimeout(() => {
      closeAlert()
    }, 3000)
  }
  function closeAlert() {
    clearTimeout(timer)
    timer = undefined
    alert.reset()
  }
  function handleClick() {
    if (timer) {
      closeAlert()
    }
  }
  function handleKeyDown(e) {
    if (timer && e.code === 'Escape') {
      closeAlert()
    }
  }
</script>

<svelte:body on:keydown={handleKeyDown} />

{#if $alert.type !== ''}
  <div
    class="h-min-content fixed bottom-0 left-0 z-50 flex w-screen justify-center"
    transition:fade
    on:click={handleClick}
    on:keydown={handleKeyDown}
  >
    <div
      class={clsx(
        'mx-3 mb-3 flex w-full max-w-lg items-center gap-2 rounded-md p-3 shadow',
        bgColor,
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
      <div class="grow">{$alert.message}</div>
    </div>
  </div>
{/if}
