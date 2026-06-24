import { Server as HttpServer } from 'http'
import { Server as SocketServer } from 'socket.io'

let io: SocketServer

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketServer(httpServer, {
    cors: { origin: '*' },
  })
  io.on('connection', socket => {
    console.log('Socket connected:', socket.id)
    socket.on('disconnect', () => console.log('Socket disconnected:', socket.id))
  })
  return io
}

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}
