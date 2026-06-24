import { Platform } from 'react-native'
// For real device testing, change DEVICE_IP to your machine's local IP
const DEVICE_IP = '192.168.1.100'
export const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:6000/api'
    : 'http://localhost:6000/api'
  : `http://${DEVICE_IP}:6000/api`
