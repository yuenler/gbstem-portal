<script lang="ts">
  import Nav from '../lib/components/Nav.svelte'
  import '../app.css'
  import { onMount } from 'svelte'
  import { initializeApp } from 'firebase/app'
  import { getAnalytics } from 'firebase/analytics'
  import { getAuth, onAuthStateChanged } from 'firebase/auth'
  import Footer from '../lib/components/Footer.svelte'

  let isLoggedIn = false
  let isEmailVerified = false

  const env = process.env.NODE_ENV
  if (env === 'development') {
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: 'hackharvard-portal.firebaseapp.com',
      projectId: 'hackharvard-portal',
      storageBucket: 'hackharvard-portal.appspot.com',
      messagingSenderId: process.env.FIREBASE_MSG_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MSR_ID
    }
    const app = initializeApp(firebaseConfig)
    //   const analytics = getAnalytics(app)
  } else if (env === 'production') {
    fetch('/__/firebase/init.json')
      .then(async response => {
        const app = initializeApp(await response.json())
        getAnalytics(app)
      })
      .catch(response => console.log(response))
  }

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
  <main class="mt-20 px-dynamic py-8 grow">
    <slot />
  </main>
  <Footer />
</div>
