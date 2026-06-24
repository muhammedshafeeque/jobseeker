import React, { useCallback, useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, ActivityIndicator, RefreshControl, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native'
import { useFocusEffect } from '@react-navigation/native'
import { Colors } from '../../Constants/Colors'
import { Routes } from '../../Constants/Routes'
import { api } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { NavigationProp } from '../../types/navigation'

interface JobStats {
  total: number
  applied: number
  interview: number
  offers: number
}

interface ContactStats {
  total: number
  unread: number
}

interface RecentContact {
  _id: string
  name: string
  email: string
  message: string
  status: string
  createdAt: string
}

const formatTime = (ts: string): string => {
  if (!ts) return ''
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  unread:      { color: Colors.unread, bg: Colors.unreadBg },
  viewed:      { color: Colors.viewed, bg: Colors.viewedBg },
  connected:   { color: Colors.connected, bg: Colors.connectedBg },
  application_sent: { color: Colors.applicationSent, bg: Colors.applicationSentBg },
  mail_sent:   { color: Colors.mailSent, bg: Colors.mailSentBg },
  closed:      { color: Colors.closed, bg: Colors.closedBg },
}

const getStatusMeta = (status: string) =>
  STATUS_COLORS[status] ?? { color: Colors.textMuted, bg: Colors.surface }

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export default function Home() {
  const navigation = useNavigation<NavigationProp<typeof Routes.Dashboard>>()
  const { user } = useAuth()
  const [jobStats, setJobStats] = useState<JobStats>({ total: 0, applied: 0, interview: 0, offers: 0 })
  const [contactStats, setContactStats] = useState<ContactStats>({ total: 0, unread: 0 })
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const [jStats, cStats, contacts] = await Promise.all([
        api.get<{ total: number; byStatus: { _id: string; count: number }[] }>('/jobs/stats'),
        api.get<{ total: number; byStatus: { _id: string; count: number }[] }>('/contacts/stats'),
        api.get<RecentContact[]>('/contacts'),
      ])

      const jBy = Object.fromEntries((jStats.byStatus ?? []).map(s => [s._id, s.count]))
      setJobStats({
        total: jStats.total ?? 0,
        applied: jBy.applied ?? 0,
        interview: (jBy.interview_1 ?? 0) + (jBy.interview_2 ?? 0) + (jBy.interview_3 ?? 0),
        offers: jBy.offer ?? 0,
      })
      const cBy = Object.fromEntries((cStats.byStatus ?? []).map(s => [s._id, s.count]))
      setContactStats({
        total: cStats.total ?? 0,
        unread: cBy.unread ?? 0,
      })
      setRecentContacts(Array.isArray(contacts) ? contacts.slice(0, 5) : [])
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = () => {
    setRefreshing(true)
    load()
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good {greeting()},</Text>
          <Text style={s.name}>{user?.name?.split(' ')[0] ?? 'Admin'}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Job Stats */}
        <Text style={s.sectionTitle}>Job Tracker</Text>
        <View style={s.statsRow}>
          <StatCard label="Total" value={jobStats.total} color={Colors.primary} icon="briefcase" />
          <StatCard label="Applied" value={jobStats.applied} color={Colors.applicationSent} icon="send" />
          <StatCard label="Interview" value={jobStats.interview} color={Colors.connected} icon="people" />
          <StatCard label="Offers" value={jobStats.offers} color={Colors.success} icon="trophy" />
        </View>

        {/* Enquiry Stats */}
        <Text style={s.sectionTitle}>Enquiries</Text>
        <View style={s.statsRow}>
          <StatCard label="Total" value={contactStats.total} color={Colors.primary} icon="mail" />
          <StatCard label="Unread" value={contactStats.unread} color={Colors.unread} icon="mail-unread" />
        </View>

        {/* View Opportunities */}
        <TouchableOpacity
          style={s.opportunitiesBtn}
          onPress={() => navigation.navigate(Routes.Opportunities as any)}
          activeOpacity={0.8}
        >
          <Icon name="flash-outline" size={18} color={Colors.primary} />
          <Text style={s.opportunitiesBtnText}>View Opportunities</Text>
          <Icon name="chevron-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>

        {/* Recent Enquiries */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Recent Enquiries</Text>
          <TouchableOpacity onPress={() => navigation.navigate(Routes.Enquiries as any)}>
            <Text style={s.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        ) : recentContacts.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>No enquiries yet</Text>
          </View>
        ) : (
          recentContacts.map(e => (
            <RecentCard
              key={e._id}
              item={e}
              onPress={() =>
                navigation.navigate(Routes.EnquiryDetail as any, { enquiryId: e._id })
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={[s.statCard, { borderTopColor: color }]}>
      <Icon name={icon as any} size={18} color={color} />
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

function RecentCard({ item, onPress }: { item: RecentContact; onPress: () => void }) {
  const meta = getStatusMeta(item.status)
  const isUnread = item.status === 'unread'

  return (
    <TouchableOpacity style={s.recentCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.avatarCircle, { backgroundColor: meta.bg }]}>
        <Text style={[s.avatarLetter, { color: meta.color }]}>
          {(item.name ?? '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={s.recentInfo}>
        <View style={s.recentTop}>
          <Text style={[s.recentName, isUnread && s.bold]} numberOfLines={1}>{item.name}</Text>
          <Text style={s.recentTime}>{formatTime(item.createdAt)}</Text>
        </View>
        <Text style={[s.recentMsg, isUnread && s.bold]} numberOfLines={1}>{item.message}</Text>
      </View>
      <View style={[s.badge, { backgroundColor: meta.bg }]}>
        <Text style={[s.badgeText, { color: meta.color }]}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: { fontSize: 13, color: Colors.textSec },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: Colors.borderFaint,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: 11, color: Colors.textSec, marginTop: 2 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12, marginTop: 4,
  },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  opportunitiesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  opportunitiesBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  recentCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderFaint,
  },
  avatarCircle: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarLetter: { fontSize: 18, fontWeight: '800' },
  recentInfo: { flex: 1, marginRight: 8 },
  recentTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  recentName: { fontSize: 14, color: Colors.text, flex: 1 },
  recentTime: { fontSize: 11, color: Colors.textMuted, marginLeft: 8 },
  recentMsg: { fontSize: 12, color: Colors.textSec },
  bold: { fontWeight: '700', color: Colors.text },
  badge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  empty: {
    alignItems: 'center', paddingVertical: 40,
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.borderFaint,
  },
  emptyText: { fontSize: 14, color: Colors.textMuted },
})
