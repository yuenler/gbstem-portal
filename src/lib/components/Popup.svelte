<!-- Modal.svelte -->
<script>
  export let show = false
  export let title = 'Modal Title'
  export let content = 'Modal Content'

  function closeModal() {
    show = false
  }
</script>

{#if show}
  <div class="fixed inset-0 flex items-center justify-center z-50">
    <div class="absolute inset-0 bg-black opacity-50"></div>

    <div class="bg-white w-96 p-4 rounded shadow-lg z-50">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">{title}</h2>
        <button class="text-gray-600 hover:text-gray-800" on:click={closeModal}>
          <svg
            class="h-6 w-6 fill-current"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 10.586l4.293-4.293a1 1 0 0 1 1.414 1.414L13.414 12l4.293 4.293a1 1 0 0 1-1.414 1.414L12 13.414l-4.293 4.293a1 1 0 1 1-1.414-1.414L10.586 12 6.293 7.707a1 1 0 0 1 1.414-1.414L12 10.586z"
            />
          </svg>
        </button>
      </div>
      <p>{content}</p>
    </div>
  </div>
{/if}
