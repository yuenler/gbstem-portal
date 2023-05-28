import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import { user } from '$lib/firebase'

export async function load({ parent }) {
  if (browser) {
    await parent()
    const currentUser = await user.get()
    if (currentUser.signedIn && !currentUser.emailVerified) {
      goto('/profile')
    }
  }
}
