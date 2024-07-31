import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import postmark from 'postmark'
import {
  POSTMARK_API_TOKEN,
} from '$env/static/private'
import { addDataToHtmlTemplate } from '$lib/utils'
import { communityServiceEmailTemplate } from '$lib/data/emailTemplates/communityServiceEmailTemplate'

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json();
  const firstName = body.firstName;
  const email = body.email;
  if (locals.user === null) {
    throw error(400, 'User not signed in.')
  } else {
    const template = {
      name: 'communityServiceEmail',
      data: {
        subject: `gbSTEM Community Service Hours Confirmation for ${firstName}`,
        app: {
          firstName: firstName,
          hours: body.hours,
          season: body.season,
          year: body.year,
          presidents: body.presidents,
          name: 'Portal',
          link: 'https://portal.gbstem.org',
        },
      },
    }

    const htmlBody = addDataToHtmlTemplate(communityServiceEmailTemplate, template);

    const emailData: Data.EmailData = {
      From: 'donotreply@gbstem.org',
      To: email,
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
