import React, { useCallback, useMemo, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, StatusBar, ActivityIndicator, RefreshControl, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native'
import { useFocusEffect } from '@react-navigation/native'
import { Colors } from '../../Constants/Colors'
import { Routes } from '../../Constants/Routes'
import { api } from '../../services/api'
import { NavigationProp } from '../../types/navigation'

interface Contact {
  _id: string
  name: string
  email: string
  message: string
  status: string
  createdAt: string
  adminNote?: string
}

const STATUS_META = [
  { value: 'unread',           label: 'Unread',           color: Colors.unread,        bg: Colors.unreadBg,        icon: 'mail-unread-outline' },
  { value: 'viewed',           label: 'Viewed',           color: Colors.viewed,        bg: Colors.viewedBg,        icon: 'eye-outline' },
  { value: 'connected',        label: 'Connected',        color: Colors.connected,     bg: Colors.connectedBg,     icon: 'call-outline' },
  { value: 'application_sent', label: 'App Sent',         color: Colors.applicationSent, bg: Colors.applicationSentBg, icon: 'document-text-outline' },
  { value: 'mail_sent',        label: 'Mail Sent',        color: Colors.mailSent,      bg: Colors.mailSentBg,      icon: 'send-outline' },
  { value: 'closed',           label: 'Closed',           color: Colors.closed,        bg: Colors.closedBg,        icon: 'checkmark-circle-outline' },
]

const getStatusMeta = (status: string) =>
  STATUS_META.find(s => s.value === status) ?? STATUS_META[0]

const ALL = 'all'

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

export default function EnquiriesList() {
  const navigation = useNavigation<NavigationProp<typeof Routes.Enquiries>>()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>(ALL)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await api.get<Contact[]>('/contacts')
      setContacts(Array.isArray(data) ? data : [])
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load enquiries')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const filtered = useMemo(() => {
    let list = activeFilter === ALL ? contacts : contacts.filter(e => e.status === activeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        e =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.message.toLowerCase().includes(q),
      )
    }
    return list
  }, [contacts, activeFilter, search])

  const counts = useMemo(
    () =>
      STATUS_META.reduce(
        (acc, s) => ({ ...acc, [s.value]: contacts.filter(e => e.status === s.value).length }),
        {} as Record<string, number>,
      ),
    [contacts],
  )

  const tabs = [
    { key: ALL, label: `All (${contacts.length})`, color: Colors.primary },
    ...STATUS_META.map(s => ({ key: s.value, label: `${s.label} (${counts[s.value] ?? 0})`, color: s.color })),
  ]

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={s.header}>
        <Text style={s.headerTitle}>Enquiries</Text>
      </View>

      <View style={s.searchWrap}>
        <Icon name="search-outline" size={16} color={Colors.textSec} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Search by name, email or message…"
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={tabs}
        keyExtractor={t => t.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabList}
        renderItem={({ item: tab }) => {
          const active = activeFilter === tab.key
          return (
            <TouchableOpacity
              style={[s.tab, active && { backgroundColor: tab.color + '25', borderColor: tab.color }]}
              onPress={() => setActiveFilter(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.tabText, active && { color: tab.color }]}>{tab.label}</Text>
            </TouchableOpacity>
          )
        }}
      />

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={e => e._id}
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
              <Icon name="mail-outline" size={48} color={Colors.border} />
              <Text style={s.emptyText}>No enquiries found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <EnquiryRow
              item={item}
              onPress={() =>
                navigation.navigate(Routes.EnquiryDetail as any, { enquiryId: item._id })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}

function EnquiryRow({ item, onPress }: { item: Contact; onPress: () => void }) {
  const meta = getStatusMeta(item.status)
  const isUnread = item.status === 'unread'

  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.75}>
      {isUnread && <View style={s.unreadDot} />}

      <View style={[s.avatar, { backgroundColor: meta.bg }]}>
        <Text style={[s.avatarLetter, { color: meta.color }]}>
          {(item.name ?? '?').charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <Text style={[s.rowName, isUnread && s.bold]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={s.rowTime}>{formatTime(item.createdAt)}</Text>
        </View>
        <Text style={s.rowEmail} numberOfLines={1}>{item.email}</Text>
        <Text style={[s.rowMsg, isUnread && s.bold]} numberOfLines={2}>
          {item.message}
        </Text>
      </View>

      <View style={[s.statusBadge, { backgroundColor: meta.bg }]}>
        <Icon name={meta.icon as any} size={12} color={meta.color} />
        <Text style={[s.statusText, { color: meta.color }]}>{meta.label}</Text>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, margin: 12, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
  tabList: { paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  tab: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSec },
  listContent: { padding: 12, paddingTop: 4, paddingBottom: 40 },
  row: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10,
    borderWidth: 1, borderColor: Colors.borderFaint, position: 'relative',
  },
  unreadDot: {
    position: 'absolute', top: 14, left: 6,
    width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.unread,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarLetter: { fontSize: 18, fontWeight: '800' },
  rowBody: { flex: 1, marginRight: 8 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  rowName: { fontSize: 14, color: Colors.text, flex: 1 },
  rowEmail: { fontSize: 11, color: Colors.textSec, marginBottom: 4 },
  rowMsg: { fontSize: 12, color: Colors.textSec, lineHeight: 17 },
  rowTime: { fontSize: 11, color: Colors.textMuted, marginLeft: 6 },
  bold: { fontWeight: '700', color: Colors.text },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start',
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: Colors.textMuted },
})
