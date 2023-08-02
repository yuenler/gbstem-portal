<script lang="ts">
  import { user } from '$lib/client/firebase'
  import { onMount } from 'svelte'

  onMount(() =>
    user.subscribe((user) => {
      if (user) {
        console.log(user.object.emailVerified)
        if (!user.object.emailVerified) {
          // user.object.reload().then(() => {
          //   user.object.getIdToken(true)
          // })
        }
      }
    }),
  )
</script>

<slot />
