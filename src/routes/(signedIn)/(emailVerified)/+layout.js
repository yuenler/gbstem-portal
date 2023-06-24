import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import { user } from '$lib/firebase'

export async function load({ parent }) {
  if (browser) {
    await parent()
    const currentUser = await user.get()
    const isSignedIn = await user.isSignedIn()
    if (isSignedIn && !currentUser.emailVerified) {
      goto('/profile')
    }
  }
}
