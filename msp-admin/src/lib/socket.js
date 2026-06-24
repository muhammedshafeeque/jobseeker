import { io } from 'socket.io-client'

const socket = io('/', { autoConnect: false })

export const connectSocket = () => socket.connect()
export const disconnectSocket = () => socket.disconnect()
export default socket
