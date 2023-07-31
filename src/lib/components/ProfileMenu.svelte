<script lang="ts">
  import clsx from 'clsx'
  import { fade } from 'svelte/transition'
  import { clickOutside } from '$lib/utils'
  import { navigating } from '$app/stores'
  import { signOut } from 'firebase/auth'
  import { auth } from '$lib/client/firebase'
  import { goto } from '$app/navigation'

  let className = ''
  export { className as class }

  let open = false
  $: if ($navigating) {
    open = false
  }
  function handleSignOut() {
    fetch('/api/auth', {
      method: 'DELETE',
    })
      .then(() => {
        signOut(auth)
        goto('/signin')
      })
      .catch((err) => console.log('Sign Out Error:', err))
  }
</script>

<div
  class={clsx('relative md:flex md:items-center', className)}
  use:clickOutside
  on:outclick={() => {
    open = false
  }}
>
  <button
    class="hidden sm:block"
    type="button"
    on:click={() => {
      open = !open
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="h-10 w-10"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  </button>
  {#if open}
    <div
      class="absolute right-0 top-12 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-sm"
      transition:fade={{ duration: 150 }}
    >
      <a
        class="block w-full px-6 py-2 transition-colors duration-300 hover:bg-gray-100"
        href="/profile">Profile</a
      >
      <button
        class="w-full px-6 py-2 text-left transition-colors duration-300 hover:bg-gray-100"
        type="button"
        on:click={handleSignOut}
      >
        Sign out
      </button>
    </div>
  {/if}
  <div class="grid grid-cols-2 gap-3 text-center sm:hidden">
    <a
      class="block w-full rounded-md border border-gray-200 px-6 py-2 shadow-sm transition-colors duration-300 hover:bg-gray-100"
      href="/profile">Profile</a
    >
    <button
      class="w-full rounded-md border border-gray-200 px-6 py-2 shadow-sm transition-colors duration-300 hover:bg-gray-100"
      type="button"
      on:click={handleSignOut}
    >
      Sign out
    </button>
  </div>
</div>
