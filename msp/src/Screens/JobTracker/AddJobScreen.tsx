import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, ActivityIndicator, Alert, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Colors } from '../../Constants/Colors'
import { Routes } from '../../Constants/Routes'
import { api } from '../../services/api'
import { NavigationProp, ScreenRouteProp, JobApplication } from '../../types/navigation'

const JOB_STATUSES = [
  'draft', 'applied', 'phone_screen', 'code_test',
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

const getStatusMeta = (status: string) =>
  STATUS_COLOR[status] ?? { color: Colors.textMuted, bg: Colors.surface }

export default function AddJobScreen() {
  const navigation = useNavigation<NavigationProp<typeof Routes.AddJob>>()
  const route = useRoute<ScreenRouteProp<typeof Routes.AddJob>>()
  const job = route.params?.job as JobApplication | undefined
  const isEditing = !!job

  const [company, setCompany] = useState(job?.company ?? '')
  const [role, setRole] = useState(job?.role ?? '')
  const [jd, setJd] = useState(job?.jd ?? '')
  const [location, setLocation] = useState(job?.location ?? '')
  const [jobUrl, setJobUrl] = useState(job?.jobUrl ?? '')
  const [maxBudget, setMaxBudget] = useState(job?.maxBudget?.toString() ?? '')
  const [notes, setNotes] = useState(job?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState(job?.status ?? 'draft')

  const handleSave = async () => {
    if (!company.trim() || !role.trim()) {
      Alert.alert('Validation', 'Company and Role are required.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        company: company.trim(),
        role: role.trim(),
        jd: jd.trim(),
        location: location.trim() || undefined,
        jobUrl: jobUrl.trim() || undefined,
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
        notes: notes.trim() || undefined,
      }
      if (isEditing) {
        await api.put(`/jobs/${job._id}`, payload)
      } else {
        await api.post('/jobs', payload)
      }
      navigation.goBack()
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save job')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (!isEditing) return
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
              navigation.goBack()
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Failed to delete')
            }
          },
        },
      ],
    )
  }

  const handleStatusUpdate = async (status: string) => {
    if (!isEditing || currentStatus === status) return
    setUpdatingStatus(status)
    try {
      await api.patch(`/jobs/${job._id}/status`, { status })
      setCurrentStatus(status)
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isEditing ? 'Edit Job' : 'Add Job'}</Text>
        {isEditing ? (
          <TouchableOpacity onPress={handleDelete}>
            <Text style={s.deleteBtn}>Delete</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Status update row (edit only) */}
        {isEditing && (
          <View style={s.card}>
            <Text style={s.label}>Status</Text>
            <FlatList
              data={JOB_STATUSES}
              keyExtractor={s => s}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item: st }) => {
                const meta = getStatusMeta(st)
                const isActive = currentStatus === st
                const isLoading = updatingStatus === st
                return (
                  <TouchableOpacity
                    style={[
                      sts.statusPill,
                      { borderColor: meta.color + '55', backgroundColor: isActive ? meta.color : meta.bg },
                    ]}
                    onPress={() => handleStatusUpdate(st)}
                    disabled={!!updatingStatus}
                    activeOpacity={0.75}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={isActive ? '#fff' : meta.color} />
                    ) : (
                      <Text style={[sts.statusPillText, { color: isActive ? '#fff' : meta.color }]}>
                        {st.replace(/_/g, ' ')}
                      </Text>
                    )}
                  </TouchableOpacity>
                )
              }}
            />
          </View>
        )}

        <View style={s.card}>
          <Field label="Company *" value={company} onChangeText={setCompany} placeholder="e.g. Acme Corp" />
          <Field label="Role *" value={role} onChangeText={setRole} placeholder="e.g. Frontend Engineer" />
          <Field
            label="Job Description"
            value={jd}
            onChangeText={setJd}
            placeholder="Paste JD here…"
            multiline
            numberOfLines={5}
          />
          <Field label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Bangalore, Remote" />
          <Field
            label="Job URL"
            value={jobUrl}
            onChangeText={setJobUrl}
            placeholder="https://…"
            keyboardType="url"
          />
          <Field
            label="Max Budget / LPA"
            value={maxBudget}
            onChangeText={setMaxBudget}
            placeholder="e.g. 20"
            keyboardType="numeric"
          />
          <Field
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any private notes…"
            multiline
            numberOfLines={3}
            last
          />
        </View>

        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.saveBtnText}>{isEditing ? 'Save Changes' : 'Add Job'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

function Field({
  label, value, onChangeText, placeholder, multiline, numberOfLines, keyboardType, last,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  multiline?: boolean
  numberOfLines?: number
  keyboardType?: 'default' | 'url' | 'numeric'
  last?: boolean
}) {
  return (
    <View style={[f.wrap, !last && f.wrapBorder]}>
      <Text style={f.label}>{label}</Text>
      <TextInput
        style={[f.input, multiline && { minHeight: (numberOfLines ?? 3) * 22, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
      />
    </View>
  )
}

const f = StyleSheet.create({
  wrap: { paddingBottom: 14, marginBottom: 14 },
  wrapBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
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
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  deleteBtn: { fontSize: 15, fontWeight: '600', color: Colors.error },
  scroll: { padding: 14, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.borderFaint,
  },
  label: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})

const sts = StyleSheet.create({
  statusPill: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, minWidth: 80, alignItems: 'center',
  },
  statusPillText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
})
