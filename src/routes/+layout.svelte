<script>
  import '../app.css'
  import Nav from '$lib/components/Nav.svelte'
  import Footer from '$lib/components/Footer.svelte'
  import Alert from '$lib/components/Alert.svelte'
  import { auth, user } from '$lib/firebase'
  import { onAuthStateChanged } from 'firebase/auth'
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'

  let loading = true
  onMount(() => {
    onAuthStateChanged($auth, handleSignInState)
  })
  function handleSignInState(userData) {
    loading = true
    if (userData) {
      if ($page.url.pathname === '/signin' || $page.url.pathname === '/signup') {
        goto('/')
      }
    } else {
      if ($page.url.pathname !== '/signin' && $page.url.pathname !== '/signup') {
        goto('/signin')
      }
    }
    loading = false
  }
</script>

{#if !loading}
  {#if $user}
    <Nav />
  {/if}
  <div class="flex flex-col min-h-screen overflow-y-auto">
    <main class="mt-20 px-dynamic py-8 grow">
      <slot />
    </main>
    <Footer />
  </div>
  <Alert />
{/if}
