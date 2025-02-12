<script lang="ts">
  import ProfileMenu from './ProfileMenu.svelte'
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import Brand from './Brand.svelte'
  import { navigating } from '$app/stores'
  import { fade } from 'svelte/transition'
  // import AnnouncementsBell from './AnnouncementsBell.svelte'
  import { cubicInOut } from 'svelte/easing'
  import { cn } from '$lib/utils'
    import { doc, getDoc } from 'firebase/firestore'
    import { decisionsCollection } from '$lib/data/constants'
    import { db } from '$lib/client/firebase'

  export let user: Data.User.Peek

  let shadow = false
  let open = false
  let pages = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Forms', href: '/apply' },
    { name: 'Classes', href: '/classes' },
    // { name: 'FAQ', href: '/faq' },
  ]

  onMount(() => {
    updateShadow();

    (async () => {
      try {
        const document = await getDoc(doc(db, decisionsCollection, user.uid));
        if (document.exists() && document.data().type === 'accepted') {
          pages = [...pages, { name: 'Curriculum', href: '/curriculum' }, { name:'Community Service Hours Tracker', 'href':'/community-service'}];
        }
      } catch (error) {
        console.error('Error fetching document:', error);
      }
    })();

    const unsubscribe = navigating.subscribe((navigating) => {
      if (navigating) {
        open = false;
      }
    });

    // Return the cleanup function
    return () => {
      unsubscribe();
    };
  })
  $: pathname = $page.url.pathname

  function updateShadow() {
    shadow = window.scrollY !== 0
  }
</script>
<svelte:window on:scroll={updateShadow} />
<nav
  class={cn(
    'fixed left-0 top-0 z-40 flex h-20 w-full items-center justify-between border-b bg-white px-d transition-all',
    shadow && !open ? 'shadow-b border-gray-200' : 'border-white',
  )}
>
{#await pages then pages}
  <div class="flex items-center gap-8">
    <Brand />
    {#if user.emailVerified}
      <div class="hidden items-center gap-3 sm:flex">
        {#each pages as page}
          <a
            class={cn(
              'rounded-md px-4 py-2 transition-colors',
              pathname === page.href ? 'bg-gray-200' : 'hover:bg-gray-100',
            )}
            href={page.href}
          >
            {page.name}
          </a>
        {/each}
      </div>
    {/if}
  </div>
  <div class="flex items-center gap-1 sm:gap-3 md:gap-4">
    <!-- {#if user.emailVerified}
      <AnnouncementsBell />
    {/if} -->
    <ProfileMenu class="hidden sm:block" />
    <button
      class="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-200 sm:hidden"
      type="button"
      on:click={() => {
        open = !open
      }}
    >
      {#if open}
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
      {:else}
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
            d="M3.75 9h16.5m-16.5 6.75h16.5"
          />
        </svg>
      {/if}
    </button>
  </div>
  {/await}
</nav>
{#if open}
  <div
    class="fixed left-0 top-20 z-50 flex h-[calc(100vh-5rem)] w-screen flex-col gap-2 bg-white p-d sm:hidden"
    transition:fade={{
      easing: cubicInOut,
      duration: 200,
    }}
  >
    {#if user.emailVerified}
      {#each pages as page}
        <a
          class={cn(
            'rounded-md px-3 py-2 transition-colors',
            pathname === page.href ? 'bg-gray-200' : 'hover:bg-gray-100',
          )}
          href={page.href}
        >
          {page.name}
        </a>
      {/each}
    {/if}
    <div class={cn(user.emailVerified && 'mt-d')}>
      <ProfileMenu />
    </div>
  </div>
{/if}
<style>
  .shadow-b {
    box-shadow: 0 1px 2px -1px rgb(0 0 0 / 0.1);
  }
</style>
