import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendNotificationEmail(options: EmailOptions): Promise<boolean> {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      })

      await transporter.sendMail({
        from: `"VoyageCraft Alerts" <${user}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.subject,
      })

      return true
    } catch (error) {
      console.error('Failed to send email via SMTP:', error)
      return false
    }
  }

  // Graceful fallback when SMTP credentials are not configured
  console.log(`[EMAIL NOTIFICATION LOG] To: ${options.to} | Subject: ${options.subject}`)
  return true
}
