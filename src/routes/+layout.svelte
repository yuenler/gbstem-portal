<script lang="ts">
  import Nav from '../lib/components/Nav.svelte'
  import Auth from './auth/+page.svelte'
  import Dashboard from './dashboard/+page.svelte'
  import '../app.css'
  import { Container } from 'sveltestrap/src'
  import { onMount } from 'svelte'
  // Import the functions you need from the SDKs you need
  import { initializeApp } from 'firebase/app'
  import { getAnalytics } from 'firebase/analytics'
  import { getAuth, onAuthStateChanged } from 'firebase/auth'

  let isLoggedIn = true

  onMount(() => {
    const firebaseConfig = {
      apiKey: 'AIzaSyBuFDxD2Zt2i40-dSNZz3Xrt0YypVRj6OA',
      authDomain: 'hackharvard-portal.firebaseapp.com',
      projectId: 'hackharvard-portal',
      storageBucket: 'hackharvard-portal.appspot.com',
      messagingSenderId: '831224207920',
      appId: '1:831224207920:web:ae366f9b14464726f5abf5',
      measurementId: 'G-N72ZTKXS9Y'
    }
    const app = initializeApp(firebaseConfig)
    const analytics = getAnalytics(app)

    onAuthStateChanged(getAuth(), user => {
      if (user) {
        isLoggedIn = true
      } else {
        isLoggedIn = false
      }
    })
  })
</script>

{#if isLoggedIn}
  <Nav />
  <main class="mt-20 px-dynamic">
    <Dashboard />
  </main>
{:else}
  <main class="mt-20 px-dynamic">
    <Auth />
  </main>
{/if}
