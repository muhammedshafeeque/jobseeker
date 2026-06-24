import React, { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, RefreshControl, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Colors } from '../../Constants/Colors'
import { Routes } from '../../Constants/Routes'
import { api } from '../../services/api'
import { NavigationProp, JobApplication } from '../../types/navigation'

const STATUS_PILLS = [
  'All', 'draft', 'applied', 'phone_screen', 'code_test',
  'interview_1', 'interview_2', 'interview_3', 'offer', 'accepted', 'rejected', 'withdrawn',
]

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  draft:        { color: Colors.textMuted,  bg: Colors.surface },
  applied:      { color: Colors.primary,    bg: Colors.primaryBg },
  phone_screen: { color: Colors.warning,    bg: 'rgba(251,191,36,0.15)' },
  code_test:    { color: Colors.warning,    bg: 'rgba(251,191,36,0.15)' },
  interview_1:  { color: Colors.connected,  bg: Colors.connectedBg },
  interview_2:  { color: Colors.connected,  bg: Colors.connectedBg },
  interview_3:  { color: Colors.connected,  bg: Colors.connectedBg },
  offer:        { color: Colors.success,    bg: Colors.applicationSentBg },
  accepted:     { color: '#10b981',         bg: 'rgba(16,185,129,0.15)' },
  rejected:     { color: Colors.error,      bg: Colors.unreadBg },
  withdrawn:    { color: Colors.error,      bg: Colors.unreadBg },
}

const getStatusColor = (status: string) =>
  STATUS_COLOR[status] ?? { color: Colors.textMuted, bg: Colors.surface }

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function JobTrackerScreen() {
  const navigation = useNavigation<NavigationProp<typeof Routes.JobTracker>>()
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')

  const load = useCallback(async () => {
    try {
      const data = await api.get<JobApplication[]>('/jobs')
      setJobs(Array.isArray(data) ? data : [])
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load jobs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const filtered = activeFilter === 'All'
    ? jobs
    : jobs.filter(j => j.status === activeFilter)

  const handleDelete = (job: JobApplication) => {
    Alert.alert(
      'Delete Job',
      `Remove "${job.company} – ${job.role}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.del(`/jobs/${job._id}`)
              load()
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Failed to delete job')
            }
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={s.header}>
        <Text style={s.headerTitle}>Job Tracker</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => navigation.navigate(Routes.AddJob as any, undefined)}
          activeOpacity={0.8}
        >
          <Icon name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={STATUS_PILLS}
        keyExtractor={p => p}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.pillList}
        renderItem={({ item }) => {
          const active = activeFilter === item
          const meta = item === 'All' ? null : getStatusColor(item)
          const color = meta?.color ?? Colors.primary
          return (
            <TouchableOpacity
              style={[s.pill, active && { backgroundColor: color + '25', borderColor: color }]}
              onPress={() => setActiveFilter(item)}
              activeOpacity={0.7}
            >
              <Text style={[s.pillText, active && { color }]}>
                {item === 'All' ? `All (${jobs.length})` : item.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          )
        }}
      />

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={j => j._id}
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
              <Icon name="briefcase-outline" size={48} color={Colors.border} />
              <Text style={s.emptyText}>No jobs found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => navigation.navigate(Routes.AddJob as any, { job: item })}
              onLongPress={() => handleDelete(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}

function JobCard({ job, onPress, onLongPress }: {
  job: JobApplication
  onPress: () => void
  onLongPress: () => void
}) {
  const meta = getStatusColor(job.status)
  const dateLabel = job.appliedAt
    ? `Applied ${formatDate(job.appliedAt)}`
    : `Added ${formatDate(job.createdAt)}`

  return (
    <TouchableOpacity
      style={s.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
      delayLongPress={500}
    >
      <View style={s.cardTop}>
        <View style={s.cardMain}>
          <Text style={s.company} numberOfLines={1}>{job.company}</Text>
          <Text style={s.role} numberOfLines={1}>{job.role}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: meta.bg }]}>
          <Text style={[s.statusText, { color: meta.color }]}>
            {job.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>
      <View style={s.cardMeta}>
        {job.location ? (
          <View style={s.metaItem}>
            <Icon name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={s.metaText}>{job.location}</Text>
          </View>
        ) : null}
        {job.maxBudget ? (
          <View style={s.metaItem}>
            <Icon name="cash-outline" size={12} color={Colors.textMuted} />
            <Text style={s.metaText}>₹{job.maxBudget} LPA</Text>
          </View>
        ) : null}
        <View style={s.metaItem}>
          <Icon name="calendar-outline" size={12} color={Colors.textMuted} />
          <Text style={s.metaText}>{dateLabel}</Text>
        </View>
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
  addBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
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
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardMain: { flex: 1, marginRight: 8 },
  company: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  role: { fontSize: 13, color: Colors.textSec },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textMuted },
})
