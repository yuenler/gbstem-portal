import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import postmark from 'postmark'
import type { FirebaseError } from 'firebase-admin'
import {
  POSTMARK_API_TOKEN,
} from '$env/static/private'
import { addDataToHtmlTemplate } from '$lib/utils'
import { interviewScheduledEmailTemplate } from '$lib/data/emailTemplates/interviewScheduledEmailTemplate'

export const POST: RequestHandler = async ({ request, locals }) => {
  let topError
  try {
    const body = await request.json()
    try {
      const interviewerEmail = body.email;
      const interviewDate = body.date
      const interviewLink = body.link;
      const interviewerName = body.interviewer;
      const intervieweeFirstName = body.firstName;
      if (locals.user === null) {
        throw error(400, 'User not signed in.')
      } else {
        const template = {
          name: 'interviewScheduled',
          data: {
            subject: `${intervieweeFirstName}, your interview with ${interviewerName} has been scheduled`,
            app: {
              name: 'Portal',
              link: 'https://portal.gbstem.org',
            },
            interview: {
              interviewee: intervieweeFirstName,
              name: interviewerName,
              date: interviewDate,
              link: interviewLink,
            }
          },
        }

        const htmlBody = addDataToHtmlTemplate(interviewScheduledEmailTemplate, template);

        const emailData: Data.EmailData = {
          From: 'donotreply@gbstem.org',
          To: locals.user.email,
          Cc: 'contact@gbstem.org, ' + interviewerEmail,
          Subject: String(template.data.subject),
          HTMLBody: htmlBody,
          ReplyTo: interviewerEmail,
          MessageStream: 'outbound'
        }
        try {
          const client = new postmark.ServerClient(POSTMARK_API_TOKEN);
          await client.sendEmail(emailData);

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
