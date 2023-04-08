<script>
  import '../app.css'
  import Alert from '$lib/components/Alert.svelte'
  import Footer from '$lib/components/Footer.svelte'
</script>

<div class="flex min-h-screen flex-col overflow-y-auto">
  <main class="px-dynamic mt-20 grow py-8">
    <slot />
  </main>
  <Footer />
</div>
<Alert />
