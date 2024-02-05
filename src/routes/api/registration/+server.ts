import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import postmark from 'postmark'
import {
  POSTMARK_API_TOKEN,
} from '$env/static/private'
import { addDataToHtmlTemplate } from '$lib/utils'
import { registrationSubmittedEmailTemplate } from '$lib/data/emailTemplates/registrationSubmittedEmailTemplate'

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json();
  const firstName = body.firstName;
  const studentName = body.studentName;
  const secondaryEmail = body.secondaryEmail;
  if (locals.user === null) {
    throw error(400, 'User not signed in.')
  } else {
    const template = {
      name: 'registrationSubmitted',
      data: {
        subject: 'Next steps for your gbSTEM registration',
        app: {
          firstName: firstName,
          studentName: studentName,
          name: 'Portal',
          link: 'https://portal.gbstem.org',
        },
      },
    }

    const htmlBody = addDataToHtmlTemplate(registrationSubmittedEmailTemplate, template);

    const emailData: Data.EmailData = {
      From: 'donotreply@gbstem.org',
      To: secondaryEmail !== '' ? `${locals.user.email}, ${secondaryEmail}` : locals.user.email,
      Cc: '',
      Subject: String(template.data.subject),
      HTMLBody: htmlBody,
      ReplyTo: 'contact@gbstem.org',
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
}
