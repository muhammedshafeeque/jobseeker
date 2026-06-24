import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, StatusBar,
} from 'react-native'
import { GoogleSignin, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin'
import auth from '@react-native-firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Colors } from '../../Constants/Colors'
import { GOOGLE_WEB_CLIENT_ID } from '../../Constants/Firebase'
import { API_BASE_URL } from '../../Constants/Config'
import { tokenStore } from '../../services/tokenStore'

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
})

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      .then(() => setReady(true))
      .catch(e => setError(e?.message ?? 'Failed to initialise Google Sign-In'))
  }, [])

  const signIn = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await GoogleSignin.signIn()
      if (!isSuccessResponse(response)) return

      const idToken =
        response.data.idToken ?? (await GoogleSignin.getTokens()).idToken
      if (!idToken) {
        throw new Error('Google Sign-In did not return an ID token.')
      }

      await auth().signInWithCredential(auth.GoogleAuthProvider.credential(idToken))

      // Exchange idToken for server token
      const r = await fetch(`${API_BASE_URL}/auth/mobile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      if (r.status === 403) {
        await auth().signOut()
        setError('This Google account is not authorized')
        return
      }

      if (r.ok) {
        const { token, user } = await r.json()
        await AsyncStorage.setItem('serverToken', token)
        await AsyncStorage.setItem('serverUser', JSON.stringify(user))
        tokenStore.set(token)
      }
    } catch (e: any) {
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return
      if (e?.code === statusCodes.IN_PROGRESS) return
      if (e?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services is not available on this device.')
        return
      }
      setError(e?.message ?? 'Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={s.card}>
        <View style={s.iconWrap}>
          <Text style={s.iconEmoji}>📬</Text>
        </View>
        <Text style={s.title}>Admin Panel</Text>
        <Text style={s.sub}>Manage your portfolio enquiries</Text>

        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.btn, (!ready || loading) && s.btnDisabled]}
          onPress={signIn}
          disabled={!ready || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={s.googleG}>G</Text>
              <Text style={s.btnText}>{ready ? 'Sign in with Google' : 'Initialising…'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderFaint,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconEmoji: { fontSize: 36 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: Colors.textSec,
    marginBottom: 28,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: Colors.unreadBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorText: { color: Colors.error, fontSize: 13, textAlign: 'center' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
  },
  btnDisabled: { opacity: 0.55 },
  googleG: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
})
