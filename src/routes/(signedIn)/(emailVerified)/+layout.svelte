<script lang="ts">
  import { user } from '$lib/client/firebase'
  import { getIdToken } from 'firebase/auth'
  import { onMount } from 'svelte'

  onMount(() =>
    user.subscribe((user) => {
      if (user) {
        console.log(user.object.emailVerified)
        if (!user.object.emailVerified) {
          console.log('i ran?')
          user.object.reload().then(() => {
            getIdToken(user.object, true)
          })
        }
      }
    }),
  )
</script>

<slot />
