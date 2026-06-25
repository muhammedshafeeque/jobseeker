import { Server as HttpServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import { verifyToken } from '../Utils/auth.utils'

let io: SocketServer

export const initSocket = (httpServer: HttpServer) => {
  const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',').map(s => s.trim()).filter(Boolean)

  io = new SocketServer(httpServer, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : false,
      credentials: true,
    },
    connectTimeout: 10_000,
    pingTimeout: 30_000,
    pingInterval: 25_000,
  })

  // Require a valid JWT before accepting any socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) return next(new Error('Unauthorized'))
    try {
      const payload = verifyToken(token) as { id: string }
      ;(socket as any).userId = payload.id
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', socket => {
    const userId = (socket as any).userId as string
    // Scope each client to their own room so events never cross user boundaries
    socket.join(`user:${userId}`)
  })

  return io
}

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

/** Emit an event only to the authenticated owner. */
export const emitToUser = (userId: string, event: string, data: unknown) => {
  getIO().to(`user:${userId}`).emit(event, data)
}
