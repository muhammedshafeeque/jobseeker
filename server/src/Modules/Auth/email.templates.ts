import dotenv from 'dotenv'

dotenv.config()

const brandName = process.env.MAIL_FROM_NAME ?? 'Byzand'
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'

type EmailLayoutOptions = {
  title: string
  preheader: string
  heading: string
  body: string
  cta?: { label: string; href: string }
  footerNote?: string
}

const emailLayout = ({
  title,
  preheader,
  heading,
  body,
  cta,
  footerNote,
}: EmailLayoutOptions) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8 0%,#4338ca 100%);padding:28px 32px;">
              <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.78);font-weight:600;">${brandName}</p>
              <h1 style="margin:10px 0 0;font-size:28px;line-height:1.25;color:#ffffff;font-weight:700;">${heading}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#334155;">${body}</p>
              ${
                cta
                  ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 8px;">
                <tr>
                  <td style="border-radius:12px;background:linear-gradient(135deg,#2563eb 0%,#4f46e5 100%);">
                    <a href="${cta.href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">${cta.label}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#64748b;word-break:break-all;">
                Or copy this link:<br />
                <a href="${cta.href}" style="color:#2563eb;text-decoration:none;">${cta.href}</a>
              </p>`
                  : ''
              }
              ${
                footerNote
                  ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:28px;">
                <tr>
                  <td style="padding:16px 18px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">${footerNote}</p>
                  </td>
                </tr>
              </table>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;">
                © ${new Date().getFullYear()} ${brandName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

export const emailTemplates = {
  verifyEmail: (token: string) => {
    const href = `${frontendUrl}/verify-email?token=${token}`
    return emailLayout({
      title: 'Verify your email',
      preheader: 'Confirm your email address to finish setting up your account.',
      heading: 'Verify your email',
      body: `Thanks for signing up. Please confirm your email address so we can keep your account secure and send you important updates.`,
      cta: { label: 'Verify email address', href },
      footerNote:
        'This link expires in 8 hours. If you did not create an account, you can safely ignore this email.',
    })
  },

  resetPassword: (token: string) => {
    const href = `${frontendUrl}/reset-password?token=${token}`
    return emailLayout({
      title: 'Reset your password',
      preheader: 'Use this secure link to choose a new password.',
      heading: 'Reset your password',
      body: `We received a request to reset the password for your account. Click the button below to choose a new password.`,
      cta: { label: 'Reset password', href },
      footerNote:
        'If you did not request a password reset, you can ignore this email and your password will stay the same.',
    })
  },

  welcomeEmail: (name: string) =>
    emailLayout({
      title: 'Welcome aboard',
      preheader: `Welcome to ${brandName}, ${name}!`,
      heading: `Welcome, ${name}!`,
      body: `Your account is ready. You can now sign in, explore the platform, and manage everything from one place.`,
      footerNote: `We're glad to have you with ${brandName}.`,
    }),

  accountVerification: (name: string) =>
    emailLayout({
      title: 'Account verified',
      preheader: `Your ${brandName} account has been verified.`,
      heading: 'You are all set',
      body: `Hi ${name}, your email address has been verified successfully. Your account is now fully active.`,
      footerNote: 'You can sign in anytime using your email and password.',
    }),

  passwordReset: (name: string) =>
    emailLayout({
      title: 'Password updated',
      preheader: 'Your password was changed successfully.',
      heading: 'Password updated',
      body: `Hi ${name}, your password has been changed successfully. You can now sign in with your new password.`,
      footerNote:
        'If you did not make this change, contact support immediately so we can help secure your account.',
    }),
}
