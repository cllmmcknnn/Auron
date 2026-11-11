// Minimal Resend client over fetch, so no extra dependency is needed.
// Docs: https://resend.com/docs/api-reference/emails/send-email

export interface SendEmailInput {
  to: string
  subject: string
  text: string
  html: string
}

export async function sendEmail({ to, subject, text, html }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  // onboarding@resend.dev only delivers to the email address on your Resend account.
  // To email other students, verify your own domain in Resend and set RESEND_FROM.
  const from = process.env.RESEND_FROM || 'Auron <onboarding@resend.dev>'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to: [to], subject, text, html })
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Resend responded ${response.status}: ${detail.slice(0, 300)}`)
  }
}
