<script lang="ts">
  import '../app.css'
  import Alert from '$lib/components/Alert.svelte'
  import Footer from '$lib/components/Footer.svelte'
  import { navigating } from '$app/stores'
  import { onMount } from 'svelte'
  import NProgress from 'nprogress'

  onMount(() => {
    NProgress.configure({ showSpinner: false })
    return navigating.subscribe((navigating) => {
      if (navigating) {
        NProgress.start()
      } else {
        NProgress.done()
      }
    })
  })
</script>

<div class="flex min-h-screen flex-col overflow-y-auto">
  <main class="px-d mt-20 grow py-8">
    <slot />
  </main>
  <Footer />
</div>
<Alert />
