import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import messaging from '@react-native-firebase/messaging'
import auth from '@react-native-firebase/auth'

import AppNavigator from './src/AppNavigator'
import { setupAdminNotifications, onForegroundMessage } from './src/services/notifications'
import { Colors } from './src/Constants/Colors'
import { Routes } from './src/Constants/Routes'
import { RootStackParamList } from './src/types/navigation'

// Handle background/quit notification taps
messaging().setBackgroundMessageHandler(async _msg => {})

export default function App() {
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null)
  const [toast, setToast] = useState<{ title: string; body: string; enquiryId?: string } | null>(null)
  const toastAnim = useRef(new Animated.Value(0)).current

  const showToast = (title: string, body: string, enquiryId?: string) => {
    setToast({ title, body, enquiryId })
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(4000),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null))
  }

  const navigateToEnquiry = (enquiryId?: string) => {
    if (!enquiryId) return
    navRef.current?.navigate(Routes.EnquiryDetail, { enquiryId })
  }

  useEffect(() => {
    // Setup FCM when auth state changes
    const authUnsub = auth().onAuthStateChanged(async user => {
      if (user) {
        await setupAdminNotifications(user.uid)
      }
    })

    // Foreground messages — show custom in-app toast
    const msgUnsub = onForegroundMessage((title, body, data) => {
      showToast(title, body, data.enquiryId)
    })

    // App opened from background notification tap
    const bgTapUnsub = messaging().onNotificationOpenedApp(msg => {
      const id = msg.data?.enquiryId as string | undefined
      if (id) navigateToEnquiry(id)
    })

    // App opened from quit state via notification
    messaging().getInitialNotification().then(msg => {
      if (msg?.data?.enquiryId) {
        // Delay to let navigator mount
        setTimeout(() => navigateToEnquiry(msg.data!.enquiryId as string), 500)
      }
    })

    return () => {
      authUnsub()
      msgUnsub()
      bgTapUnsub()
    }
  }, [])

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navRef}>
        <AppNavigator />
      </NavigationContainer>

      {/* In-app notification toast */}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            },
          ]}
        >
          <View style={styles.toastIcon}>
            <Text style={styles.toastIconText}>📬</Text>
          </View>
          <View style={styles.toastBody}>
            <Text style={styles.toastTitle} numberOfLines={1}>{toast.title}</Text>
            <Text style={styles.toastMsg} numberOfLines={2}>{toast.body}</Text>
          </View>
          {toast.enquiryId && (
            <TouchableOpacity
              style={styles.toastAction}
              onPress={() => { navigateToEnquiry(toast.enquiryId); setToast(null) }}
            >
              <Text style={styles.toastActionText}>View</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', top: 52, left: 14, right: 14,
    backgroundColor: Colors.text, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 12, zIndex: 999,
  },
  toastIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  toastIconText: { fontSize: 18 },
  toastBody: { flex: 1 },
  toastTitle: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
  toastMsg: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  toastAction: {
    backgroundColor: Colors.primary, paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 8,
  },
  toastActionText: { fontSize: 12, fontWeight: '700', color: '#fff' },
})
