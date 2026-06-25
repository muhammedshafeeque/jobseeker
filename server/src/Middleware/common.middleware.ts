import { NextFunction, Request, Response } from 'express'

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' })
}

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = Number(err.status) || 500
  if (status >= 500) console.error(err) // only log real server errors
  // never leak stack traces or internal messages for 5xx
  const message = status < 500 ? (err.message ?? 'Request failed') : 'Internal server error'
  res.status(status).json({ message })
}