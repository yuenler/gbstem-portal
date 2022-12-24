<script>
  import ProfileMenu from './ProfileMenu.svelte'
  import { classNames } from '$lib/utils.js'
  import { page } from '$app/stores'

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
  $: pathname = $page.url.pathname
</script>

<nav
  class="fixed top-0 left-0 z-10 border-b border-gray-400 h-20 flex items-center w-full px-dynamic justify-between"
>
  <div class="flex items-center gap-6">
    <div class="flex items-center rounded-md shadow-md gap-2 p-3 bg-red-200">
      <a href="https://hackharvard.io"><img class="w-8 h-8" src="/favicon.png" alt="" /></a>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
        />
      </svg>

      <a class="text-2xl" href="https://portal.hackharvard.io">Portal</a>
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
