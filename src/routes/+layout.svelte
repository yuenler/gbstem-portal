<script lang="ts">
  import Nav from '../lib/components/Nav.svelte'
  import Auth from './auth/+page.svelte'
  import '../app.css'
  import { onMount } from 'svelte'
  import { initializeApp } from 'firebase/app'
  // import { getAnalytics } from 'firebase/analytics'
  import { getAuth, onAuthStateChanged } from 'firebase/auth'
  import Footer from '../lib/components/Footer.svelte'

  let isLoggedIn = false
  let isEmailVerified = false

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
  //   const analytics = getAnalytics(app)

  onMount(() => {
    onAuthStateChanged(getAuth(), user => {
      if (user) {
        isLoggedIn = true
        isEmailVerified = user.emailVerified
      } else {
        isLoggedIn = false
      }
    })
  })
</script>

<Nav />
<div class="flex flex-col min-h-screen">
  <main class="mt-20 p-dynamic grow">
    <slot />
  </main>
  <Footer />
</div>
