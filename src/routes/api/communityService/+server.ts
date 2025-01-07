import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import postmark from 'postmark'
import {
  SENDGRID_API_TOKEN,
} from '$env/static/private'
import { addDataToHtmlTemplate } from '$lib/utils'
import { communityServiceEmailTemplate } from '$lib/data/emailTemplates/communityServiceEmailTemplate'
import MailService, { MailDataRequired } from '@sendgrid/mail'

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
          course: body.course,
          presidents: body.presidents,
          name: 'Portal',
          link: 'https://portal.gbstem.org',
        },
      },
    }

    const htmlBody = addDataToHtmlTemplate(communityServiceEmailTemplate, template);

    const emailData: MailDataRequired = {
      from: 'donotreply@gbstem.org',
      to: email,
      cc: '',
      subject: String(template.data.subject),
      html: htmlBody,
      replyTo: 'contact@gbstem.org',
      text: 'Community Service Hours Confirmation',
    }

      MailService.setApiKey(SENDGRID_API_TOKEN)
      MailService
      .send(emailData)
      .then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error(error.toString())
      })

    return new Response()
  }
}
