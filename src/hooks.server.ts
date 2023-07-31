import type { UserProfile } from '$lib/client/firebase'
import { adminAuth, adminDb } from '$lib/server/firebase'
import type { Handle } from '@sveltejs/kit'

export const handle = (async ({ event, resolve }) => {
  const sessionCookie = event.cookies.get('__session')
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie!)
    const userRecord = await adminAuth.getUser(decodedClaims.uid)
    const userProfileDoc = await adminDb
      .collection('users')
      .doc(decodedClaims.uid)
      .get()
    const userProfile = userProfileDoc.data() as UserProfile
    event.locals.user = {
      ...userProfile,
      emailVerified: userRecord.emailVerified,
    }
  } catch (err) {
    event.locals.user = null
  }
  return resolve(event)
}) satisfies Handle
