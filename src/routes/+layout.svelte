<script lang="ts">
  import Nav from '$lib/components/Nav.svelte'
  import '../app.css'
  import { Container } from 'sveltestrap/src'
  import { onMount } from 'svelte'
  // Import the functions you need from the SDKs you need
  import firebase, { initializeApp } from 'firebase/app'
  import { getAnalytics } from 'firebase/analytics'
  import 'firebase/auth'

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
  })
</script>

<Nav />
<main class="mt-20 px-dynamic">
  <slot />
</main>
