import messaging from '@react-native-firebase/messaging'
import { Platform, PermissionsAndroid } from 'react-native'
import { saveAdminFCMToken } from './firestore'

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    const status = await messaging().requestPermission()
    return (
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL
    )
  }
  if (Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    )
    return result === PermissionsAndroid.RESULTS.GRANTED
  }
  return true
}

export const setupAdminNotifications = async (uid: string): Promise<(() => void) | undefined> => {
  const granted = await requestNotificationPermission()
  if (!granted) return undefined

  const token = await messaging().getToken()
  await saveAdminFCMToken(uid, token)

  const unsub = messaging().onTokenRefresh(newToken => {
    saveAdminFCMToken(uid, newToken)
  })

  return unsub
}

export const onForegroundMessage = (
  cb: (title: string, body: string, data: Record<string, string>) => void,
) =>
  messaging().onMessage(async msg => {
    if (msg.notification) {
      cb(msg.notification.title ?? '', msg.notification.body ?? '', (msg.data ?? {}) as Record<string, string>)
    }
  })
