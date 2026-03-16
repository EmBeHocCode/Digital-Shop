function wrapMailTemplate(title: string, intro: string, actionLabel: string, actionUrl: string, outro: string) {
  return {
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6;color:#111827;background:#f8fafc;padding:24px;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;padding:32px;">
          <p style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;margin:0 0 16px;">NexCloud</p>
          <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px;">${title}</h1>
          <p style="margin:0 0 20px;color:#475569;">${intro}</p>
          <a href="${actionUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:12px;font-weight:600;">
            ${actionLabel}
          </a>
          <p style="margin:24px 0 0;color:#475569;">${outro}</p>
          <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
        </div>
      </div>
    `,
    text: `${title}\n\n${intro}\n\n${actionLabel}: ${actionUrl}\n\n${outro}\n\nNếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.`,
  }
}

export function buildEmailVerificationMail(input: {
  name?: string | null
  verificationUrl: string
}) {
  const intro = input.name
    ? `Xin chào ${input.name}, hãy xác minh email để kích hoạt tài khoản NexCloud và tiếp tục đăng nhập an toàn.`
    : "Hãy xác minh email để kích hoạt tài khoản NexCloud và tiếp tục đăng nhập an toàn."

  return {
    subject: "Xác minh email tài khoản NexCloud",
    ...wrapMailTemplate(
      "Xác minh email tài khoản",
      intro,
      "Xác minh email",
      input.verificationUrl,
      "Liên kết này có hiệu lực trong 24 giờ."
    ),
  }
}

export function buildPasswordResetMail(input: {
  name?: string | null
  resetUrl: string
}) {
  const intro = input.name
    ? `Xin chào ${input.name}, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản NexCloud của bạn.`
    : "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản NexCloud của bạn."

  return {
    subject: "Đặt lại mật khẩu NexCloud",
    ...wrapMailTemplate(
      "Đặt lại mật khẩu",
      intro,
      "Tạo mật khẩu mới",
      input.resetUrl,
      "Liên kết này có hiệu lực trong 2 giờ."
    ),
  }
}
