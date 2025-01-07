import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import postmark from 'postmark'
import {
  SENDGRID_API_TOKEN,
} from '$env/static/private'
import { addDataToHtmlTemplate } from '$lib/utils'
import { applicationSubmittedEmailTemplate } from '$lib/data/emailTemplates/applicationSubmittedEmailTemplate'
import MailService, { MailDataRequired } from '@sendgrid/mail'

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json();
  const firstName = body.firstName;
  if (locals.user === null) {
    throw error(400, 'User not signed in.')
  } else {
    const template = {
      name: 'applicationSubmitted',
      data: {
        subject: 'Next steps for your gbSTEM application',
        app: {
          firstName: firstName,
          name: 'Portal',
          link: 'https://portal.gbstem.org',
        },
      },
    }

    const htmlBody = addDataToHtmlTemplate(applicationSubmittedEmailTemplate, template);

    const emailData: MailDataRequired = {
      from: 'donotreply@gbstem.org',
      to: locals.user.email,
      cc: '',
      subject: String(template.data.subject),
      html: htmlBody,
      replyTo: 'contact@gbstem.org',
      text: 'Application Submitted',
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
