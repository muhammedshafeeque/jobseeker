import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, StatusBar, Keyboard,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { Colors } from '../../Constants/Colors'
import { Routes } from '../../Constants/Routes'
import { api } from '../../services/api'
import { NavigationProp, ScreenRouteProp } from '../../types/navigation'

interface StatusHistoryEntry {
  status: string
  note?: string
  changedAt: string
}

interface Contact {
  _id: string
  name: string
  email: string
  message: string
  status: string
  createdAt: string
  adminNote?: string
  statusHistory: StatusHistoryEntry[]
}

const STATUS_META = [
  { value: 'unread',           label: 'Unread',     color: Colors.unread,        bg: Colors.unreadBg,        icon: 'mail-unread-outline' },
  { value: 'viewed',           label: 'Viewed',     color: Colors.viewed,        bg: Colors.viewedBg,        icon: 'eye-outline' },
  { value: 'connected',        label: 'Connected',  color: Colors.connected,     bg: Colors.connectedBg,     icon: 'call-outline' },
  { value: 'application_sent', label: 'App Sent',   color: Colors.applicationSent, bg: Colors.applicationSentBg, icon: 'document-text-outline' },
  { value: 'mail_sent',        label: 'Mail Sent',  color: Colors.mailSent,      bg: Colors.mailSentBg,      icon: 'send-outline' },
  { value: 'closed',           label: 'Closed',     color: Colors.closed,        bg: Colors.closedBg,        icon: 'checkmark-circle-outline' },
]

const getStatusMeta = (status: string) =>
  STATUS_META.find(s => s.value === status) ?? STATUS_META[0]

const formatFull = (dateStr: string): string => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function EnquiryDetail() {
  const navigation = useNavigation<NavigationProp<typeof Routes.EnquiryDetail>>()
  const route = useRoute<ScreenRouteProp<typeof Routes.EnquiryDetail>>()
  const { enquiryId } = route.params

  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const markedViewed = useRef(false)

  const load = useCallback(async () => {
    try {
      const data = await api.get<Contact>(`/contacts/${enquiryId}`)
      setContact(data)
      setNote(data.adminNote ?? '')

      if (!markedViewed.current && data.status === 'unread') {
        markedViewed.current = true
        await api.patch(`/contacts/${enquiryId}/status`, { status: 'viewed', note: '' })
        setContact(prev => prev ? { ...prev, status: 'viewed' } : prev)
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load enquiry')
    } finally {
      setLoading(false)
    }
  }, [enquiryId])

  useEffect(() => { load() }, [load])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const handleStatusChange = async (status: string) => {
    if (contact?.status === status) return
    setUpdatingStatus(status)
    try {
      await api.patch(`/contacts/${enquiryId}/status`, { status, note: '' })
      setContact(prev => prev ? { ...prev, status } : prev)
    } catch {
      Alert.alert('Error', 'Failed to update status. Please try again.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleSaveNote = async () => {
    Keyboard.dismiss()
    setSavingNote(true)
    try {
      await api.patch(`/contacts/${enquiryId}/note`, { adminNote: note })
    } catch {
      Alert.alert('Error', 'Failed to save note.')
    } finally {
      setSavingNote(false)
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (!contact) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg }}>
        <Text style={{ color: Colors.textSec }}>Enquiry not found.</Text>
      </View>
    )
  }

  const currentMeta = getStatusMeta(contact.status)

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>{contact.name}</Text>
          <View style={[s.currentBadge, { backgroundColor: currentMeta.bg }]}>
            <Icon name={currentMeta.icon as any} size={12} color={currentMeta.color} />
            <Text style={[s.currentBadgeText, { color: currentMeta.color }]}>
              {currentMeta.label}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <View style={[s.card, s.contactCard]}>
            <View style={[s.avatar, { backgroundColor: currentMeta.bg }]}>
              <Text style={[s.avatarLetter, { color: currentMeta.color }]}>
                {(contact.name ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={s.contactInfo}>
              <Text style={s.contactName}>{contact.name}</Text>
              <Text style={s.contactEmail}>{contact.email}</Text>
              <Text style={s.contactTime}>{formatFull(contact.createdAt)}</Text>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.sectionLabel}>Message</Text>
            <Text style={s.message}>{contact.message}</Text>
          </View>

          <View style={s.card}>
            <Text style={s.sectionLabel}>Update Status</Text>
            <View style={s.actionGrid}>
              {STATUS_META.filter(st => st.value !== 'viewed').map(st => {
                const isActive = contact.status === st.value
                const isLoading = updatingStatus === st.value
                return (
                  <TouchableOpacity
                    key={st.value}
                    style={[
                      s.actionBtn,
                      { borderColor: st.color + '55', backgroundColor: isActive ? st.color : st.bg },
                    ]}
                    onPress={() => handleStatusChange(st.value)}
                    disabled={isLoading || !!updatingStatus}
                    activeOpacity={0.75}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={isActive ? '#fff' : st.color} />
                    ) : (
                      <Icon name={st.icon as any} size={18} color={isActive ? '#fff' : st.color} />
                    )}
                    <Text style={[s.actionLabel, { color: isActive ? '#fff' : st.color }]}>
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.sectionLabel}>Admin Notes</Text>
            <TextInput
              style={s.noteInput}
              multiline
              numberOfLines={4}
              placeholder="Add private notes about this enquiry…"
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={setNote}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[s.saveBtn, savingNote && { opacity: 0.6 }]}
              onPress={handleSaveNote}
              disabled={savingNote}
              activeOpacity={0.8}
            >
              {savingNote ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.saveBtnText}>Save Note</Text>
              )}
            </TouchableOpacity>
          </View>

          {(contact.statusHistory ?? []).length > 0 && (
            <View style={s.card}>
              <TouchableOpacity
                style={s.historyToggle}
                onPress={() => setShowHistory(v => !v)}
                activeOpacity={0.7}
              >
                <Text style={s.sectionLabel}>Status History</Text>
                <Icon
                  name={showHistory ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.textSec}
                />
              </TouchableOpacity>

              {showHistory && (
                <View style={s.timeline}>
                  {[...contact.statusHistory].reverse().map((entry, i) => {
                    const m = getStatusMeta(entry.status)
                    return (
                      <View key={i} style={s.timelineItem}>
                        <View style={[s.timelineDot, { backgroundColor: m.color }]} />
                        {i < contact.statusHistory.length - 1 && <View style={s.timelineLine} />}
                        <View style={s.timelineContent}>
                          <View style={[s.timelineBadge, { backgroundColor: m.bg }]}>
                            <Text style={[s.timelineBadgeText, { color: m.color }]}>{m.label}</Text>
                          </View>
                          <Text style={s.timelineTime}>{formatFull(entry.changedAt)}</Text>
                          {entry.note ? <Text style={s.timelineNote}>{entry.note}</Text> : null}
                        </View>
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.text },
  currentBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  currentBadgeText: { fontSize: 11, fontWeight: '700' },
  scroll: { padding: 14, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.borderFaint,
  },
  contactCard: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarLetter: { fontSize: 22, fontWeight: '800' },
  contactInfo: { flex: 1, justifyContent: 'center' },
  contactName: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 3 },
  contactEmail: { fontSize: 13, color: Colors.primary, fontWeight: '600', marginBottom: 4 },
  contactTime: { fontSize: 11, color: Colors.textMuted },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  message: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 12, borderWidth: 1.5, minWidth: '46%', flex: 1,
  },
  actionLabel: { fontSize: 12, fontWeight: '700', flex: 1 },
  noteInput: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 12,
    fontSize: 14, color: Colors.text, minHeight: 90, marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 11,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  historyToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  timeline: { marginTop: 12, gap: 16 },
  timelineItem: { flexDirection: 'row', gap: 12, position: 'relative' },
  timelineDot: {
    width: 10, height: 10, borderRadius: 5, marginTop: 4,
    flexShrink: 0, zIndex: 1,
  },
  timelineLine: {
    position: 'absolute', left: 4.5, top: 14, bottom: -16,
    width: 1, backgroundColor: Colors.border,
  },
  timelineContent: { flex: 1, paddingBottom: 4 },
  timelineBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, marginBottom: 4,
  },
  timelineBadgeText: { fontSize: 11, fontWeight: '700' },
  timelineTime: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  timelineNote: { fontSize: 12, color: Colors.textSec, fontStyle: 'italic' },
})
