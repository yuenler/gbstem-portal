import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { adminDb } from '$lib/server/firebase'
import postmark from 'postmark'
import {
  POSTMARK_API_TOKEN,
} from '$env/static/private'

export const POST: RequestHandler = async ({ locals }) => {
  if (locals.user === null) {
    throw error(400, 'User not signed in.')
  } else {
    const template = {
      name: 'registrationSubmitted',
      data: {
        subject: 'Next steps for your gbSTEM registration',
        app: {
          name: 'Portal',
          link: 'https://portal.gbstem.org',
        },
      },
    }
    const document = await adminDb.collection('templates').doc(template.name).get()

    const html = document.data()?.html

    // replace html template with data
    const htmlBody = html.replace(/{{(.*?)}}/g, (_, key) => {
      const keys = key.trim().split('.');
      let value = template.data;
      for (const k of keys) {
        value = value[k];
        if (value === undefined) {
          return '';
        }
      }
      return value;
    });

    const emailData: Data.EmailData = {
      From: 'donotreply@gbstem.org',
      To: locals.user.email,
      Subject: String(template.data.subject),
      HTMLBody: htmlBody,
      ReplyTo: 'contact@gbstem.org',
      MessageStream: 'outbound'
    }
    try {
      const client = new postmark.ServerClient(POSTMARK_API_TOKEN);
      client.sendEmail(emailData);

      return new Response()
    } catch (err) {
      throw error(400, 'Failed to send email.')
    }
  }
}
