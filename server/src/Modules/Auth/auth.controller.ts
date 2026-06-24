import { Request, Response, NextFunction } from 'express'
import { google } from 'googleapis'
import { generateToken } from '../../Utils/auth.utils'

const getOAuth2Client = () =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_AUTH_REDIRECT_URI,
  )

const allowedEmails = (): string[] =>
  (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

export class AuthController {
  static googleAuthUrl(_req: Request, res: Response) {
    const url = getOAuth2Client().generateAuthUrl({
      access_type: 'online',
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
    })
    res.set('Cache-Control', 'no-store')
    res.json({ url })
  }

  static async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.query as { code: string }
      const oauth2Client = getOAuth2Client()
      const { tokens } = await oauth2Client.getToken(code)
      oauth2Client.setCredentials(tokens)

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
      const { data } = await oauth2.userinfo.get()
      const email = data.email?.toLowerCase() ?? ''

      if (!allowedEmails().includes(email)) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=unauthorized`,
        )
      }

      const token = generateToken(email)
      const user = { email, name: data.name ?? email, picture: data.picture ?? '' }

      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`,
      )
    } catch (e) {
      next(e)
    }
  }

  static async mobileAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken } = req.body
      if (!idToken) {
        return res.status(400).json({ error: 'idToken is required' })
      }

      const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID)
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      })

      const payload = ticket.getPayload()
      const email = payload?.email?.toLowerCase() ?? ''

      if (!allowedEmails().includes(email)) {
        return res.status(403).json({ error: 'This Google account is not authorized' })
      }

      const token = generateToken(email)
      return res.json({
        token,
        user: {
          email,
          name: payload?.name ?? email,
          picture: payload?.picture ?? '',
        },
      })
    } catch (e) {
      next(e)
    }
  }
}
