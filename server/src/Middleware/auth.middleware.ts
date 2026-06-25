import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../Utils/auth.utils'

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  try {
    const payload = verifyToken(header.slice(7)) as { id: string }
    ;(req as any).userId = payload.id
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}
