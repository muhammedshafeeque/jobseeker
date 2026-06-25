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
      const userInfo = { email, name, picture }

      res.redirect(
        `${getFrontendUrl()}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userInfo))}`,
      )
    } catch (e) {
      next(e)
    }
  }

  static async mobileAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken } = req.body
      if (!idToken) return res.status(400).json({ error: 'idToken is required' })

      const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID)
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      })

      const payload = ticket.getPayload()
      const email = payload?.email?.toLowerCase() ?? ''
      const name = payload?.name ?? email
      const googleId = payload?.sub ?? ''
      const picture = payload?.picture ?? ''

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
