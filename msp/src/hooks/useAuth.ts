import { useState, useEffect } from 'react'
import auth from '@react-native-firebase/auth'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { tokenStore } from '../services/tokenStore'
import { API_BASE_URL } from '../Constants/Config'

interface ServerUser {
  email: string
  name: string
  picture: string
}

export const useAuth = () => {
  const [user, setUser] = useState<ServerUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = auth().onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        try {
          const [serverToken, serverUserStr] = await AsyncStorage.multiGet([
            'serverToken',
            'serverUser',
          ])
          const token = serverToken[1]
          const serverUserRaw = serverUserStr[1]

          if (token && serverUserRaw) {
            tokenStore.set(token)
            setUser(JSON.parse(serverUserRaw) as ServerUser)
            setLoading(false)
            return
          }

          // Fall back to silent sign-in to get a fresh idToken
          const signInResult = await GoogleSignin.signInSilently()
          const idToken = signInResult.data?.idToken
          if (!idToken) throw new Error('No idToken from silent sign-in')

          const res = await fetch(`${API_BASE_URL}/auth/mobile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          })

          if (!res.ok) {
            throw new Error('Server rejected token')
          }

          const { token: newToken, user: newUser } = await res.json()
          await AsyncStorage.setItem('serverToken', newToken)
          await AsyncStorage.setItem('serverUser', JSON.stringify(newUser))
          tokenStore.set(newToken)
          setUser(newUser as ServerUser)
          setLoading(false)
        } catch {
          tokenStore.set(null)
          await AsyncStorage.multiRemove(['serverToken', 'serverUser'])
          await auth().signOut()
          setUser(null)
          setLoading(false)
        }
      } else {
        tokenStore.set(null)
        await AsyncStorage.multiRemove(['serverToken', 'serverUser'])
        setUser(null)
        setLoading(false)
      }
    })

    return unsub
  }, [])

  const logout = async () => {
    tokenStore.set(null)
    await AsyncStorage.multiRemove(['serverToken', 'serverUser'])
    await auth().signOut()
  }

  return { user, loading, logout }
}
