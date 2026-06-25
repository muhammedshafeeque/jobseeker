import React, { useCallback, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons'
import { useFocusEffect } from '@react-navigation/native'
import { Colors } from '../../Constants/Colors'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

interface JobPreferences {
  jobTitles: string[]
  skills: string[]
  locations: string[]
  experienceYears?: number
  minCtcLpa?: number
  maxCtcLpa?: number
}

interface GmailAccount {
  email: string
  lastSyncAt?: string
}

interface GmailStatus {
  connected: boolean
  accounts: GmailAccount[]
}

export default function SettingsScreen() {
  const { logout, user } = useAuth()

  // Job preferences
  const [prefs, setPrefs] = useState<JobPreferences>({
    jobTitles: [], skills: [], locations: [],
  })
  const [jobTitlesInput, setJobTitlesInput] = useState('')
  const [skillsInput, setSkillsInput] = useState('')
  const [locationsInput, setLocationsInput] = useState('')
  const [expYears, setExpYears] = useState('')
  const [minCtc, setMinCtc] = useState('')
  const [maxCtc, setMaxCtc] = useState('')
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Gmail
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const loadPrefs = useCallback(async () => {
    try {
      const data = await api.get<JobPreferences>('/job-alerts/preferences')
      setPrefs(data)
      setJobTitlesInput((data.jobTitles ?? []).join(', '))
      setSkillsInput((data.skills ?? []).join(', '))
      setLocationsInput((data.locations ?? []).join(', '))
      setExpYears(data.experienceYears?.toString() ?? '')
      setMinCtc(data.minCtcLpa?.toString() ?? '')
      setMaxCtc(data.maxCtcLpa?.toString() ?? '')
    } catch {
      // Non-fatal: preferences may not be set yet
    }
  }, [])

  const loadGmailStatus = useCallback(async () => {
    try {
      const data = await api.get<GmailStatus>('/gmail/status')
      setGmailStatus(data)
    } catch {
      setGmailStatus({ connected: false, accounts: [] })
    }
  }, [])

  useFocusEffect(useCallback(() => {
    loadPrefs()
    loadGmailStatus()
  }, [loadPrefs, loadGmailStatus]))

  const savePrefs = async () => {
    setSavingPrefs(true)
    try {
      const split = (s: string) => s.split(',').map(v => v.trim()).filter(Boolean)
      const payload: JobPreferences = {
        jobTitles: split(jobTitlesInput),
        skills: split(skillsInput),
        locations: split(locationsInput),
        experienceYears: expYears ? Number(expYears) : undefined,
        minCtcLpa: minCtc ? Number(minCtc) : undefined,
        maxCtcLpa: maxCtc ? Number(maxCtc) : undefined,
      }
      await api.put('/job-alerts/preferences', payload)
      Alert.alert('Saved', 'Job preferences updated.')
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save preferences')
    } finally {
      setSavingPrefs(false)
    }
  }

  const syncGmail = async () => {
    setSyncing(true)
    try {
      await api.post('/gmail/sync')
      Alert.alert('Synced', 'Gmail sync complete.')
      loadGmailStatus()
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const disconnectGmail = async (email: string) => {
    Alert.alert('Disconnect Gmail', `Disconnect ${email}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect', style: 'destructive',
        onPress: async () => {
          setDisconnecting(true)
          try {
            await api.delete('/gmail/disconnect', { data: { email } })
            loadGmailStatus()
          } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Failed to disconnect')
          } finally {
            setDisconnecting(false)
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={s.header}>
        <Text style={s.headerTitle}>Settings</Text>
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Icon name="log-out-outline" size={18} color={Colors.error} />
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {user && (
          <View style={s.userCard}>
            <View style={s.avatar}>
              <Text style={s.avatarLetter}>
                {user.name?.charAt(0)?.toUpperCase() ?? 'A'}
              </Text>
            </View>
            <View>
              <Text style={s.userName}>{user.name}</Text>
              <Text style={s.userEmail}>{user.email}</Text>
            </View>
          </View>
        )}

        {/* Job Alert Preferences */}
        <Text style={s.sectionHeader}>Job Alert Preferences</Text>
        <View style={s.card}>
          <SettingField
            label="Job Titles"
            value={jobTitlesInput}
            onChangeText={setJobTitlesInput}
            placeholder="React Developer, Frontend Engineer…"
          />
          <SettingField
            label="Skills"
            value={skillsInput}
            onChangeText={setSkillsInput}
            placeholder="React, TypeScript, Node.js…"
          />
          <SettingField
            label="Locations"
            value={locationsInput}
            onChangeText={setLocationsInput}
            placeholder="Bangalore, Remote, Mumbai…"
          />
          <SettingField
            label="Experience (years)"
            value={expYears}
            onChangeText={setExpYears}
            placeholder="e.g. 3"
            keyboardType="numeric"
          />
          <SettingField
            label="Min CTC (LPA)"
            value={minCtc}
            onChangeText={setMinCtc}
            placeholder="e.g. 10"
            keyboardType="numeric"
          />
          <SettingField
            label="Max CTC (LPA)"
            value={maxCtc}
            onChangeText={setMaxCtc}
            placeholder="e.g. 30"
            keyboardType="numeric"
            last
          />

          <TouchableOpacity
            style={[s.saveBtn, savingPrefs && { opacity: 0.6 }]}
            onPress={savePrefs}
            disabled={savingPrefs}
            activeOpacity={0.8}
          >
            {savingPrefs ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>Save Preferences</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Gmail Integration */}
        <Text style={s.sectionHeader}>Gmail Integration</Text>
        <View style={s.card}>
          {gmailStatus === null ? (
            <ActivityIndicator color={Colors.primary} />
          ) : gmailStatus.connected && (gmailStatus.accounts ?? []).length > 0 ? (
            <>
              {(gmailStatus.accounts ?? []).map(account => (
                <View key={account.email} style={s.accountRow}>
                  <View style={[s.gmailBadge, { backgroundColor: Colors.applicationSentBg }]}>
                    <Icon name="checkmark-circle" size={14} color={Colors.success} />
                    <Text style={[s.gmailBadgeText, { color: Colors.success }]} numberOfLines={1}>
                      {account.email}
                    </Text>
                  </View>
                  {account.lastSyncAt && (
                    <Text style={s.lastSync}>
                      Last sync: {new Date(account.lastSyncAt).toLocaleString('en-IN')}
                    </Text>
                  )}
                  <View style={s.gmailActions}>
                    <TouchableOpacity
                      style={[s.syncBtn, syncing && { opacity: 0.6 }]}
                      onPress={syncGmail}
                      disabled={syncing}
                      activeOpacity={0.8}
                    >
                      {syncing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Icon name="sync-outline" size={14} color="#fff" />
                          <Text style={s.syncBtnText}>Sync</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.disconnectBtn, disconnecting && { opacity: 0.6 }]}
                      onPress={() => disconnectGmail(account.email)}
                      disabled={disconnecting}
                      activeOpacity={0.8}
                    >
                      <Text style={s.disconnectBtnText}>Disconnect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <Text style={s.gmailHint}>
                Connect additional Gmail accounts from the web admin panel.
              </Text>
            </>
          ) : (
            <>
              <View style={s.gmailRow}>
                <View style={[s.gmailBadge, { backgroundColor: 'rgba(251,191,36,0.15)' }]}>
                  <Icon name="warning-outline" size={14} color={Colors.warning} />
                  <Text style={[s.gmailBadgeText, { color: Colors.warning }]}>Not connected</Text>
                </View>
              </View>
              <Text style={s.gmailHint}>
                Connect Gmail from the web admin panel to sync your job application emails.
              </Text>
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

function SettingField({
  label, value, onChangeText, placeholder, keyboardType, last,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: 'default' | 'numeric'
  last?: boolean
}) {
  return (
    <View style={[f.wrap, !last && f.border]}>
      <Text style={f.label}>{label}</Text>
      <TextInput
        style={f.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
      />
    </View>
  )
}

const f = StyleSheet.create({
  wrap: { paddingBottom: 14, marginBottom: 14 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  input: { fontSize: 15, color: Colors.text },
})

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: Colors.unreadBg,
  },
  logoutText: { fontSize: 13, fontWeight: '700', color: Colors.error },
  scroll: { padding: 14, paddingBottom: 40, gap: 4 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.borderFaint, marginBottom: 20,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: Colors.primaryBg, justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  userName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  userEmail: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  sectionHeader: {
    fontSize: 13, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: 16, marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.borderFaint,
  },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  gmailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  accountRow: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  gmailBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  gmailBadgeText: { fontSize: 12, fontWeight: '700' },
  gmailEmail: { flex: 1, fontSize: 12, color: Colors.textSec },
  lastSync: { fontSize: 11, color: Colors.textMuted, marginBottom: 12 },
  gmailActions: { flexDirection: 'row', gap: 10 },
  syncBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10,
  },
  syncBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  disconnectBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.unreadBg, borderRadius: 10, paddingVertical: 10,
  },
  disconnectBtnText: { color: Colors.error, fontSize: 13, fontWeight: '700' },
  gmailHint: {
    fontSize: 13, color: Colors.textSec, lineHeight: 20,
    backgroundColor: Colors.surface, borderRadius: 10, padding: 12, marginTop: 8,
  },
})
