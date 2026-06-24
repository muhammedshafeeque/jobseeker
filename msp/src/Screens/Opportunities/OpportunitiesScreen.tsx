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

interface Opportunity {
  _id: string
  title: string
  company?: string
  location?: string
  expMin?: number
  expMax?: number
  budgetMin?: number
  budgetMax?: number
  source: string
  matchScore: number
  applicationStatus?: string
  isApplied?: boolean
}

const MATCH_SCORE_META: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: 'Low',       color: Colors.textMuted, bg: Colors.surface },
  1: { label: 'Fair',      color: Colors.warning,   bg: 'rgba(251,191,36,0.15)' },
  2: { label: 'Good',      color: Colors.primary,   bg: Colors.primaryBg },
  3: { label: 'Great',     color: Colors.success,   bg: Colors.applicationSentBg },
  4: { label: 'Excellent', color: '#10b981',         bg: 'rgba(16,185,129,0.15)' },
}

const SOURCE_LETTER: Record<string, string> = {
  indeed:   'I',
  naukri:   'N',
  linkedin: 'L',
  gmail:    'G',
  manual:   'M',
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

const STATUS_FILTERS = ['All', 'Applied', 'Not Applied']

export default function OpportunitiesScreen() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')
  const [applying, setApplying] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await api.get<Opportunity[]>('/job-alerts/opportunities')
      setOpportunities(Array.isArray(data) ? data : [])
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load opportunities')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const handleApply = async (opp: Opportunity) => {
    setApplying(opp._id)
    try {
      await api.post(`/job-alerts/${opp._id}/apply`)
      setOpportunities(prev =>
        prev.map(o => o._id === opp._id ? { ...o, isApplied: true, applicationStatus: 'applied' } : o)
      )
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to apply')
    } finally {
      setApplying(null)
    }
  }

  const handleDismiss = async (opp: Opportunity) => {
    try {
      await api.patch(`/job-alerts/${opp._id}/dismiss`)
      setOpportunities(prev => prev.filter(o => o._id !== opp._id))
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to dismiss')
    }
  }

  const filtered = opportunities.filter(o => {
    if (statusFilter === 'Applied') return !!o.isApplied
    if (statusFilter === 'Not Applied') return !o.isApplied
    return true
  })

  const formatBudget = (opp: Opportunity) => {
    if (opp.budgetMin && opp.budgetMax) return `₹${opp.budgetMin}–${opp.budgetMax}L`
    if (opp.budgetMax) return `₹${opp.budgetMax}L`
    if (opp.budgetMin) return `₹${opp.budgetMin}L`
    return '—'
  }

  const formatExp = (opp: Opportunity) => {
    if (opp.expMin !== undefined && opp.expMax !== undefined) return `${opp.expMin}–${opp.expMax} yrs`
    if (opp.expMax !== undefined) return `${opp.expMax} yrs`
    if (opp.expMin !== undefined) return `${opp.expMin}+ yrs`
    return '—'
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => {}}>
          {/* Rendered inside DashboardStack, goBack handled by nav */}
        </TouchableOpacity>
        <Text style={s.headerTitle}>Opportunities</Text>
        <Text style={s.countBadge}>{filtered.length}</Text>
      </View>

      {/* Status filter */}
      <FlatList
        data={STATUS_FILTERS}
        keyExtractor={f => f}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.pillList}
        renderItem={({ item }) => {
          const active = statusFilter === item
          return (
            <TouchableOpacity
              style={[s.pill, active && { backgroundColor: Colors.primaryBg, borderColor: Colors.primary }]}
              onPress={() => setStatusFilter(item)}
              activeOpacity={0.7}
            >
              <Text style={[s.pillText, active && { color: Colors.primary }]}>{item}</Text>
            </TouchableOpacity>
          )
        }}
      />

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={o => o._id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load() }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Icon name="flash-off-outline" size={48} color={Colors.border} />
              <Text style={s.emptyText}>No opportunities found</Text>
            </View>
          }
          renderItem={({ item: opp }) => {
            const scoreMeta = MATCH_SCORE_META[Math.min(opp.matchScore ?? 0, 4)] ?? MATCH_SCORE_META[0]
            const sourceMeta = getSourceMeta(opp.source)
            const sourceLetter = SOURCE_LETTER[opp.source?.toLowerCase()] ?? '?'
            const isApplying = applying === opp._id

            return (
              <View style={s.card}>
                <View style={s.cardHeader}>
                  <View style={[s.scoreBadge, { backgroundColor: scoreMeta.bg }]}>
                    <Text style={[s.scoreBadgeText, { color: scoreMeta.color }]}>{scoreMeta.label}</Text>
                  </View>
                  <View style={[s.sourceChip, { backgroundColor: sourceMeta.bg }]}>
                    <Text style={[s.sourceChipText, { color: sourceMeta.color }]}>{sourceLetter}</Text>
                  </View>
                  {opp.isApplied && (
                    <View style={[s.appliedBadge, { backgroundColor: Colors.applicationSentBg }]}>
                      <Text style={[s.appliedBadgeText, { color: Colors.applicationSent }]}>
                        {opp.applicationStatus ?? 'applied'}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={s.title} numberOfLines={2}>{opp.title}</Text>

                {(opp.company || opp.location) ? (
                  <Text style={s.meta} numberOfLines={1}>
                    {[opp.company, opp.location].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}

                <View style={s.statsRow}>
                  <View style={s.statItem}>
                    <Icon name="time-outline" size={12} color={Colors.textMuted} />
                    <Text style={s.statText}>Exp: {formatExp(opp)}</Text>
                  </View>
                  <View style={s.statItem}>
                    <Icon name="cash-outline" size={12} color={Colors.textMuted} />
                    <Text style={s.statText}>{formatBudget(opp)}</Text>
                  </View>
                </View>

                <View style={s.actionRow}>
                  {!opp.isApplied ? (
                    <TouchableOpacity
                      style={s.applyBtn}
                      onPress={() => handleApply(opp)}
                      disabled={isApplying}
                      activeOpacity={0.8}
                    >
                      {isApplying ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={s.applyBtnText}>Apply</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={s.appliedIndicator}>
                      <Icon name="checkmark-circle" size={14} color={Colors.success} />
                      <Text style={s.appliedIndicatorText}>Applied</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={s.dismissBtn}
                    onPress={() => handleDismiss(opp)}
                    activeOpacity={0.7}
                  >
                    <Icon name="close" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 0 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.text },
  countBadge: {
    fontSize: 13, fontWeight: '700', color: Colors.primary,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  scoreBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  scoreBadgeText: { fontSize: 11, fontWeight: '700' },
  sourceChip: {
    width: 22, height: 22, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center',
  },
  sourceChipText: { fontSize: 11, fontWeight: '800' },
  appliedBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  appliedBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  title: { fontSize: 14, fontWeight: '700', color: Colors.text, lineHeight: 20, marginBottom: 4 },
  meta: { fontSize: 12, color: Colors.textMuted, marginBottom: 6 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: Colors.textMuted },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  applyBtn: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: 9, alignItems: 'center',
  },
  applyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  appliedIndicator: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 9, paddingHorizontal: 4,
  },
  appliedIndicatorText: { fontSize: 13, fontWeight: '600', color: Colors.success },
  dismissBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textMuted },
})
