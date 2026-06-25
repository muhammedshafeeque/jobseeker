import { Platform } from 'react-native'

export const PRODUCTION_API = 'https://jobseeker.byzand.online/api'

export const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:6000/api'
    : 'http://localhost:6000/api'
  : PRODUCTION_API
