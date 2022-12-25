<script>
  import ProfileMenu from './ProfileMenu.svelte'
  import { classNames } from '$lib/utils.js'
  import { page } from '$app/stores'
  import { onMount } from 'svelte'

  let shadow
  $: pathname = $page.url.pathname

  onMount(() => {
    updateShadow()
  })

  const pages = [
    {
      name: 'Dashboard',
      href: '/dashboard'
    },
    {
      name: 'Apply',
      href: '/apply'
    },
    {
      name: 'Group',
      href: '/group'
    }
  ]
  function updateShadow() {
    shadow = window.pageYOffset !== 0
  }
</script>

<svelte:window on:scroll={updateShadow} />
<nav
  class={classNames(
    'fixed top-0 left-0 z-10 bg-white h-20 flex items-center w-full px-dynamic justify-between transition-all border-b',
    shadow ? 'border-gray-200 shadow-b' : 'border-white'
  )}
>
  <div class="flex items-center gap-8">
    <div class="flex items-center gap-2 rounded-md border border-gray-200 p-2 shadow">
      <a href="https://hackharvard.io"><img class="w-8 h-8" src="/favicon.png" alt="" /></a>
      <a
        class="text-lg uppercase rounded-md shadow bg-red-200 py-1 px-2"
        href="https://portal.hackharvard.io">Portal</a
      >
    </div>
    <div class="flex items-center gap-2">
      {#each pages as page}
        <a
          class={classNames(
            'rounded-md py-2 px-3 transition-colors',
            pathname === page.href && 'bg-gray-200'
          )}
          href={page.href}>{page.name}</a
        >
      {/each}
    </div>
  </div>
  <ProfileMenu />
</nav>
