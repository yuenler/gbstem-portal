<script>
  import { getAuth, signOut } from 'firebase/auth'
  let open = false
</script>

<div class="relative flex items-center">
  <button
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
      class="w-10 h-10"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  </button>
  {#if open}
    <div class="absolute top-12 right-0 bg-white rounded-md border border-gray-400 py-2 w-36">
      <a class="block hover:bg-gray-200 py-2 px-6 w-full" href="/profile">Profile</a>
      <a
        class="block hover:bg-gray-200 py-2 px-6 w-full"
        href="/auth"
        on:click={() => {
          const auth = getAuth()
          signOut(auth)
        }}>Logout</a
      >
    </div>
  {/if}
</div>
