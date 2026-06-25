import crypto from 'crypto'
import { Request, Response, NextFunction } from 'express'
import { google } from 'googleapis'
import { generateToken } from '../../Utils/auth.utils'
import { getFrontendUrl } from '../../Utils/env.utils'
import { Users } from './auth.shema'

const getOAuth2Client = () =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_AUTH_REDIRECT_URI,
  )

// ── One-time code store ───────────────────────────────────────────────────────
// Keeps JWT off the redirect URL (and therefore out of nginx access logs).
// Codes expire in 2 minutes and are deleted on first use.
interface PendingSession { token: string; user: object; expiresAt: number }
const pendingSessions = new Map<string, PendingSession>()

const storeSession = (token: string, user: object): string => {
  const code = crypto.randomBytes(24).toString('base64url')
  pendingSessions.set(code, { token, user, expiresAt: Date.now() + 2 * 60_000 })
  // Clean up expired entries lazily
  for (const [k, v] of pendingSessions) {
    if (v.expiresAt < Date.now()) pendingSessions.delete(k)
  }
  return code
}

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
      const { code } = req.query as { code?: string }
      if (!code) return res.redirect(`${getFrontendUrl()}/login?error=missing_code`)

      const oauth2Client = getOAuth2Client()
      const { tokens } = await oauth2Client.getToken(code)
      oauth2Client.setCredentials(tokens)

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
      const { data } = await oauth2.userinfo.get()
      const email = data.email?.toLowerCase() ?? ''
      const name = data.name ?? email
      const googleId = data.id ?? ''
      const picture = data.picture ?? ''

      let user = await Users.findOne({ email })
      if (!user) {
        user = await Users.create({ name, email, googleId, picture })
      } else {
        await Users.updateOne({ _id: user._id }, { googleId, picture })
      }

      const token = generateToken(String(user._id))
      const sessionCode = storeSession(token, { email, name, picture })

      // Redirect with a short-lived one-time code — JWT never touches the URL or logs
      res.redirect(`${getFrontendUrl()}/auth/callback?code=${sessionCode}`)
    } catch (e) {
      next(e)
    }
  }

  /** SPA exchanges the one-time code for the real JWT. */
  static exchangeCode(req: Request, res: Response) {
    const { code } = req.body as { code?: string }
    if (!code) return res.status(400).json({ message: 'code is required' })

    const session = pendingSessions.get(code)
    if (!session || session.expiresAt < Date.now()) {
      pendingSessions.delete(code)
      return res.status(401).json({ message: 'Invalid or expired code' })
    }

    pendingSessions.delete(code) // one-time use
    res.set('Cache-Control', 'no-store')
    res.json({ token: session.token, user: session.user })
  }

  static async mobileAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken } = req.body as { idToken?: string }
      if (!idToken) return res.status(400).json({ message: 'idToken is required' })

      const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID)
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      })

      const payload = ticket.getPayload()
      if (!payload?.email) return res.status(401).json({ message: 'Invalid token' })

      const email = payload.email.toLowerCase()
      const name = payload.name ?? email
      const googleId = payload.sub ?? ''
      const picture = payload.picture ?? ''

      let user = await Users.findOne({ email })
      if (!user) {
        user = await Users.create({ name, email, googleId, picture })
      } else {
        await Users.updateOne({ _id: user._id }, { googleId, picture })
      }

      const token = generateToken(String(user._id))
      return res.json({ token, user: { email, name, picture } })
    } catch (e) {
      next(e)
    }
  }
}
