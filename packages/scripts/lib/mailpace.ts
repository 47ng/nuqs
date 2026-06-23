// Minimal MailPace client: the official SDK is unmaintained and pulled in a
// vulnerable, ancient axios. We only send a couple of plaintext emails from the
// release pipeline, so a thin fetch wrapper around the one endpoint is enough.
// https://docs.mailpace.com/reference/send

const SEND_ENDPOINT = 'https://app.mailpace.com/api/v1/send'

export type MailPaceEmail = {
  from: string
  to: string
  subject: string
  textbody: string
  tags?: string[]
}

export async function sendEmail(
  apiToken: string,
  email: MailPaceEmail
): Promise<void> {
  const response = await fetch(SEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'MailPace-Server-Token': apiToken
    },
    body: JSON.stringify(email)
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`MailPace API error ${response.status}: ${detail}`)
  }
}
