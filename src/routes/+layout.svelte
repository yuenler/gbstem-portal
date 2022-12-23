<script>
  import '../app.css'
  import Nav from '$lib/components/Nav.svelte'
</script>

<Nav />

<main class="mt-20 px-dynamic">
  <slot />
</main>
