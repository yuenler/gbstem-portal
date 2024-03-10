import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import postmark from 'postmark'
import type { FirebaseError } from 'firebase-admin'
import {
  POSTMARK_API_TOKEN,
} from '$env/static/private'
import { addDataToHtmlTemplate, formatTime24to12 } from '$lib/utils'
import { onlineClassEnrolledEmailTemplate } from '$lib/data/emailTemplates/onlineClassEnrolledEmailTemplate'
import { inPersonClassEnrolledEmailTemplate } from '$lib/data/emailTemplates/inPersonClassEnrolledEmailTemplate'

export const POST: RequestHandler = async ({ request, locals }) => {
  let topError
  try {
    const body = await request.json()
    try {
      if (locals.user === null) {
        throw error(400, 'User not signed in.')
      } else {
        const classTimes: string[] = body.classTimes
        const classDays: string[] = body.classDays
        const classes = classDays.map(
          (day, index) => `${day} at ${formatTime24to12(classTimes[index])}`,
        )
        const class1Time = classes[0]
        const class2Time = classes[1]

        const template = {
          name: 'interviewScheduled',
          data: {
            subject: `${body.course} class details for ${body.studentName}`,
            app: {
              name: 'Portal',
              link: 'https://portal.gbstem.org',
              instructor: body.instructor,
              firstName: body.firstName,
              class1Time: class1Time,
              class2Time: class2Time,
              meetingLink: body.meetingLink,
              course: body.course,
              instructorEmail: body.instructorEmail,
              online: body.online,
              studentName: body.studentName,
            }
          },
        }

        const emailTemplate = body.online ? onlineClassEnrolledEmailTemplate : inPersonClassEnrolledEmailTemplate

        const htmlBody = addDataToHtmlTemplate(emailTemplate, template);

        const emailData: Data.EmailData = {
          From: 'donotreply@gbstem.org',
          To: locals.user.email,
          Cc: 'contact@gbstem.org, ',
          Subject: String(template.data.subject),
          HTMLBody: htmlBody,
          ReplyTo: '',
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
