import Handlebars from 'handlebars'

export const templates = {
  applicationSubmitted: input => ({
    subject: 'Your application was successfully submitted!',
    html: Handlebars.compile(
      'Hello <p>{{firstName}} {{lastName}}</p>! Congrats on your application. It is in review, and we will contact you shortly. This is an <code>HTML</code> email body.'
    )(input)
  })
}
