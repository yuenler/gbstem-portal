import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import postmark from 'postmark'
import {
  POSTMARK_API_TOKEN,
} from '$env/static/private'
import { addDataToHtmlTemplate } from '$lib/utils'
import { substituteClassEmailTemplate } from '$lib/data/emailTemplates/substituteClassEmailTemplate'

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json();
  if (locals.user === null) {
    throw error(400, 'User not signed in.')
  } else {
    const subInstructorEmail = body.subInstructorEmail;
    const originalInstructorEmail = body.originalInstructorEmail;
    const template = {
      name: 'interviewSlotRequest',
      data: {
        subject: `Class Substitute Confirmation`,
        app: {
          firstName: body.firstName,
          course: body.course,
          classNumber: body.classNumber,
          date: body.date,
          name: 'Portal',
          link: 'https://portal.gbstem.org',
        },
      },
    }

    const htmlBody = addDataToHtmlTemplate(substituteClassEmailTemplate, template);

    const emailData: Data.EmailData = {
      From: 'donotreply@gbstem.org',
      To: subInstructorEmail,
      Cc: originalInstructorEmail,
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
