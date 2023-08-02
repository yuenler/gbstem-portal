<script lang="ts">
  import { user } from '$lib/client/firebase'
  import { getIdToken } from 'firebase/auth'
  import { onMount } from 'svelte'

  onMount(() =>
    user.subscribe((user) => {
      if (user) {
        console.log(user)
        console.log('i ran?')
        getIdToken(user.object, true)
        if (!user.object.emailVerified) {
          user.object.reload().then(() => {})
        }
      }
    }),
  )
</script>

<slot />
