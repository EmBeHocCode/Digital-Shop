import nodemailer, { type Transporter } from "nodemailer"

export interface TransactionalMailPayload {
  to: string
  subject: string
  html: string
  text: string
}

export interface TransactionalMailResult {
  delivered: boolean
}

let cachedTransporter: Transporter | null = null

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_FROM
  )
}

function getTransporter() {
  if (!hasSmtpConfig()) {
    return null
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  return cachedTransporter
}

export async function sendTransactionalMail(
  payload: TransactionalMailPayload
): Promise<TransactionalMailResult> {
  const transporter = getTransporter()

  if (!transporter) {
    if (process.env.NODE_ENV === "development") {
      console.info("[mail-preview]", {
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
      })
    }

    return {
      delivered: false,
    }
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    replyTo: process.env.MAIL_REPLY_TO || process.env.MAIL_FROM,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  })

  return {
    delivered: true,
  }
}
