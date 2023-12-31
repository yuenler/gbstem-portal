import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { adminDb } from '$lib/server/firebase'
import postmark from 'postmark'
import type { FirebaseError } from 'firebase-admin'
import {
  POSTMARK_API_TOKEN,
} from '$env/static/private'

export const POST: RequestHandler = async ({ request, locals }) => {
  let topError
  try {
    const body = await request.json()
    try {
      const interviewerEmail = body.email;
      const interviewDate = body.date;
      const interviewLink = body.link;
      const interviewerName = body.interviewer;
      if (locals.user === null) {
        throw error(400, 'User not signed in.')
      } else {
        const template = {
          name: 'interviewScheduled',
          data: {
            subject: 'Your Interview Has Been Scheduled',
            app: {
              name: 'Portal',
              link: 'https://portal.gbstem.org',
            },
            interview: {
                name: interviewerName,
                date: interviewDate,
                link: interviewLink,
            }
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
          console.log(value);
          return value;
        });
    
        const emailData: Data.EmailData = {
          From: 'donotreply@gbstem.org',
          To: locals.user.email,
          Cc: interviewerEmail,
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
    } catch (err) {
      if (typeof err === 'string') {
        topError = error(400, err)
      } else {
        const typedErr = err as
          | FirebaseError
          | {
            errorInfo: FirebaseError
            codePrefix: string
          }
        if ('errorInfo' in typedErr) {
          topError = error(
            400,
            typedErr.errorInfo.message ||
            'Please wait a few minutes before trying again.',
          )
        } else if ('message' in typedErr) {
          topError = error(400, typedErr.message)
        } else {
          topError = error(400, 'Something went wrong. Please try again.')
        }
      }
    }
  } catch (err) {
    topError = error(400, 'Invalid request body.')
  }
  throw topError
  
}