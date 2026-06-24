import React, { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, RefreshControl, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons'
import { useFocusEffect } from '@react-navigation/native'
import { Colors } from '../../Constants/Colors'
import { api } from '../../services/api'

interface JobAlert {
  _id: string
  title: string
  company?: string
  location?: string
  salary?: string
  snippet?: string
  source: string
  isRead: boolean
  isSaved: boolean
  isDismissed?: boolean
  receivedAt: string
}

interface AlertStats {
  total: number
  unread: number
  saved: number
}

const SOURCE_COLORS: Record<string, { color: string; bg: string }> = {
  indeed:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.2)' },
  naukri:   { color: '#f97316', bg: 'rgba(249,115,22,0.2)' },
  linkedin: { color: '#0ea5e9', bg: 'rgba(14,165,233,0.2)' },
  gmail:    { color: '#ef4444', bg: 'rgba(239,68,68,0.2)' },
  manual:   { color: Colors.textMuted, bg: Colors.surface },
}

const getSourceMeta = (source: string) =>
  SOURCE_COLORS[source?.toLowerCase()] ?? SOURCE_COLORS.manual

const TAB_FILTERS = ['All', 'Unread', 'Saved']
const SOURCE_FILTERS = ['All', 'Indeed', 'Naukri', 'LinkedIn', 'Gmail']

const PAGE_SIZE = 20

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function JobAlertsScreen() {
  const [alerts, setAlerts] = useState<JobAlert[]>([])
  const [stats, setStats] = useState<AlertStats>({ total: 0, unread: 0, saved: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [tabFilter, setTabFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const load = useCallback(async (pageNum = 1) => {
    try {
      const params = new URLSearchParams()
      params.append('page', String(pageNum))
      params.append('limit', String(PAGE_SIZE))
      if (tabFilter === 'Unread') params.append('read', 'false')
      if (tabFilter === 'Saved') params.append('saved', 'true')
      if (sourceFilter !== 'All') params.append('source', sourceFilter.toLowerCase())

      const res = await api.get<{ alerts: JobAlert[]; total: number; unreadCount: number; savedCount: number }>(
        `/job-alerts?${params.toString()}`,
      )

      const incoming = Array.isArray(res.alerts) ? res.alerts : []
      if (pageNum === 1) {
        setAlerts(incoming)
      } else {
        setAlerts(prev => [...prev, ...incoming])
      }
      setStats({ total: res.total ?? 0, unread: res.unreadCount ?? 0, saved: res.savedCount ?? 0 })
      setPage(pageNum)
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load alerts')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [tabFilter, sourceFilter])

  useFocusEffect(useCallback(() => {
    setPage(1)
    load(1)
  }, [load]))

  const handleSync = async () => {
    setSyncing(true)
    try {
      await api.post('/job-alerts/sync')
      load(1)
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const markRead = async (alert: JobAlert) => {
    if (alert.isRead) return
    try {
      await api.patch(`/job-alerts/${alert._id}/read`)
      setAlerts(prev => prev.map(a => a._id === alert._id ? { ...a, isRead: true } : a))
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }))
    } catch {}
  }

  const toggleSave = async (alert: JobAlert) => {
    try {
      await api.patch(`/job-alerts/${alert._id}/save`)
      setAlerts(prev => prev.map(a => a._id === alert._id ? { ...a, isSaved: !a.isSaved } : a))
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to update')
    }
  }

  const dismiss = async (alert: JobAlert) => {
    try {
      await api.patch(`/job-alerts/${alert._id}/dismiss`)
      setAlerts(prev => prev.filter(a => a._id !== alert._id))
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to dismiss')
    }
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Server already filters by tab + source; use alerts directly
  const filtered = alerts

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={s.header}>
        <Text style={s.headerTitle}>Job Alerts</Text>
        <TouchableOpacity style={s.syncBtn} onPress={handleSync} disabled={syncing} activeOpacity={0.8}>
          {syncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="sync-outline" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statValue}>{stats.total}</Text>
          <Text style={s.statLabel}>Total</Text>
        </View>
        <View style={s.statCard}>
          <Text style={[s.statValue, { color: Colors.unread }]}>{stats.unread}</Text>
          <Text style={s.statLabel}>Unread</Text>
        </View>
        <View style={s.statCard}>
          <Text style={[s.statValue, { color: Colors.success }]}>{stats.saved}</Text>
          <Text style={s.statLabel}>Saved</Text>
        </View>
      </View>

      {/* Tab filter */}
      <FlatList
        data={TAB_FILTERS}
        keyExtractor={t => t}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.pillList}
        renderItem={({ item }) => {
          const active = tabFilter === item
          return (
            <TouchableOpacity
              style={[s.pill, active && { backgroundColor: Colors.primaryBg, borderColor: Colors.primary }]}
              onPress={() => { setTabFilter(item); setPage(1) }}
              activeOpacity={0.7}
            >
              <Text style={[s.pillText, active && { color: Colors.primary }]}>{item}</Text>
            </TouchableOpacity>
          )
        }}
      />

      {/* Source filter */}
      <FlatList
        data={SOURCE_FILTERS}
        keyExtractor={s => s}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[s.pillList, { paddingTop: 0 }]}
        renderItem={({ item }) => {
          const active = sourceFilter === item
          const meta = item === 'All' ? null : getSourceMeta(item)
          const color = meta?.color ?? Colors.primary
          return (
            <TouchableOpacity
              style={[s.pill, active && { backgroundColor: color + '25', borderColor: color }]}
              onPress={() => { setSourceFilter(item); setPage(1) }}
              activeOpacity={0.7}
            >
              <Text style={[s.pillText, active && { color }]}>{item}</Text>
            </TouchableOpacity>
          )
        }}
      />

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={a => a._id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(1) }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="notifications-off-outline" size={48} color={Colors.border} />
              <Text style={s.emptyText}>No alerts found</Text>
            </View>
          }
          ListFooterComponent={
            filtered.length >= page * PAGE_SIZE ? (
              <TouchableOpacity style={s.loadMore} onPress={() => load(page + 1)} activeOpacity={0.8}>
                <Text style={s.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item: alert }) => (
            <AlertCard
              alert={alert}
              isExpanded={!!expanded[alert._id]}
              onPress={() => { toggleExpand(alert._id); markRead(alert) }}
              onMarkRead={() => markRead(alert)}
              onToggleSave={() => toggleSave(alert)}
              onDismiss={() => dismiss(alert)}
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}

function AlertCard({ alert, isExpanded, onPress, onMarkRead, onToggleSave, onDismiss }: {
  alert: JobAlert
  isExpanded: boolean
  onPress: () => void
  onMarkRead: () => void
  onToggleSave: () => void
  onDismiss: () => void
}) {
  const sourceMeta = getSourceMeta(alert.source)

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.cardHeader}>
        <View style={[s.sourceBadge, { backgroundColor: sourceMeta.bg }]}>
          <Text style={[s.sourceBadgeText, { color: sourceMeta.color }]}>
            {alert.source?.toUpperCase() ?? 'N/A'}
          </Text>
        </View>
        {!alert.isRead && <View style={s.unreadDot} />}
        <Text style={s.dateText}>{formatDate(alert.receivedAt)}</Text>
      </View>

      <Text style={[s.alertTitle, !alert.isRead && s.unreadTitle]} numberOfLines={isExpanded ? undefined : 2}>
        {alert.title}
      </Text>

      {(alert.company || alert.location) ? (
        <Text style={s.alertMeta} numberOfLines={1}>
          {[alert.company, alert.location].filter(Boolean).join(' · ')}
        </Text>
      ) : null}

      {alert.salary ? (
        <Text style={s.salary}>{alert.salary}</Text>
      ) : null}

      {alert.snippet ? (
        <Text style={s.snippet} numberOfLines={isExpanded ? undefined : 2}>
          {alert.snippet}
        </Text>
      ) : null}

      <View style={s.actionRow}>
        {!alert.isRead && (
          <TouchableOpacity style={s.actionBtn} onPress={onMarkRead} activeOpacity={0.7}>
            <Icon name="checkmark-outline" size={14} color={Colors.primary} />
            <Text style={[s.actionBtnText, { color: Colors.primary }]}>Mark Read</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.actionBtn} onPress={onToggleSave} activeOpacity={0.7}>
          <Icon
            name={alert.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={14}
            color={alert.isSaved ? Colors.success : Colors.textSec}
          />
          <Text style={[s.actionBtnText, { color: alert.isSaved ? Colors.success : Colors.textSec }]}>
            {alert.isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.dismissBtn} onPress={onDismiss} activeOpacity={0.7}>
          <Icon name="close" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  syncBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row', gap: 10, padding: 12, paddingBottom: 0,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.borderFaint,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  pillList: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  pillText: { fontSize: 12, fontWeight: '600', color: Colors.textSec },
  listContent: { padding: 12, paddingTop: 4, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.borderFaint,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sourceBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  sourceBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  unreadDot: {
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.primary,
  },
  dateText: { fontSize: 11, color: Colors.textMuted, marginLeft: 'auto' },
  alertTitle: { fontSize: 14, color: Colors.textSec, lineHeight: 20, marginBottom: 4 },
  unreadTitle: { fontWeight: '700', color: Colors.text },
  alertMeta: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  salary: { fontSize: 12, color: Colors.success, fontWeight: '600', marginBottom: 4 },
  snippet: { fontSize: 12, color: Colors.textSec, lineHeight: 18, marginBottom: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  dismissBtn: {
    marginLeft: 'auto',
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  loadMore: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    alignItems: 'center', marginTop: 4, borderWidth: 1, borderColor: Colors.border,
  },
  loadMoreText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textMuted },
})
