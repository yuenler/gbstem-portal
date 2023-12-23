import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { adminDb } from '$lib/server/firebase'

export const POST: RequestHandler = async ({ locals }) => {
  if (locals.user === null) {
    throw error(400, 'User not signed in.')
  } else {
    try {
      await adminDb.collection('mail').add({
        to: [locals.user.email],
        template: {
          name: 'applicationSubmitted',
          data: {
            app: {
              name: 'Portal',
              link: 'https://portal.gbstem.org',
            },
          },
        },
      })
      return new Response()
    } catch (err) {
      throw error(400, 'Failed to send email.')
    }
  }
}
