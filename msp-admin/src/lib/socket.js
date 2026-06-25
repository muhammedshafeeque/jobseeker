import { io } from 'socket.io-client'

// Pass JWT in handshake.auth so the server can authenticate the socket.
// The token never appears in the URL.
const socket = io('/', {
  autoConnect: false,
  auth: cb => cb({ token: localStorage.getItem('token') ?? '' }),
})

export const connectSocket = () => socket.connect()
export const disconnectSocket = () => socket.disconnect()
export default socket
