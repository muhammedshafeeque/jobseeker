import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

export type EnquiryStatus =
  | 'unread'
  | 'viewed'
  | 'connected'
  | 'application_sent'
  | 'mail_sent'
  | 'closed'

export interface StatusHistoryEntry {
  status: EnquiryStatus
  timestamp: FirebaseFirestoreTypes.Timestamp
  note?: string
}

export interface Enquiry {
  id: string
  name: string
  email: string
  message: string
  timestamp: FirebaseFirestoreTypes.Timestamp
  status: EnquiryStatus
  statusHistory: StatusHistoryEntry[]
  adminNote?: string
}

export interface StatusMeta {
  value: EnquiryStatus
  label: string
  color: string
  bg: string
  icon: string
}

export const STATUS_META: StatusMeta[] = [
  { value: 'unread',           label: 'Unread',           color: '#EF4444', bg: '#FEF2F2', icon: 'mail-unread-outline' },
  { value: 'viewed',           label: 'Viewed',           color: '#3B82F6', bg: '#EFF6FF', icon: 'eye-outline' },
  { value: 'connected',        label: 'Connected',        color: '#8B5CF6', bg: '#F5F3FF', icon: 'call-outline' },
  { value: 'application_sent', label: 'Application Sent', color: '#0D9488', bg: '#F0FDFA', icon: 'document-text-outline' },
  { value: 'mail_sent',        label: 'Mail Sent',        color: '#6366F1', bg: '#EEF2FF', icon: 'send-outline' },
  { value: 'closed',           label: 'Closed',           color: '#94A3B8', bg: '#F8FAFC', icon: 'checkmark-circle-outline' },
]

export const getStatusMeta = (status: EnquiryStatus): StatusMeta =>
  STATUS_META.find(s => s.value === status) || STATUS_META[0]

export const subscribeEnquiries = (
  callback: (enquiries: Enquiry[]) => void,
  onError?: (e: Error) => void,
) =>
  firestore()
    .collection('contacts')
    .orderBy('timestamp', 'desc')
    .onSnapshot(
      snap => callback(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Enquiry, 'id'>) }))),
      onError,
    )

export const subscribeEnquiry = (
  id: string,
  callback: (enquiry: Enquiry | null) => void,
) =>
  firestore()
    .collection('contacts')
    .doc(id)
    .onSnapshot(snap =>
      callback(snap.data() != null ? ({ id: snap.id, ...(snap.data() as Omit<Enquiry, 'id'>) }) : null),
    )

export const updateEnquiryStatus = async (
  id: string,
  status: EnquiryStatus,
  note?: string,
) => {
  const entry: StatusHistoryEntry = {
    status,
    timestamp: firestore.Timestamp.now(),
    ...(note ? { note } : {}),
  }
  await firestore()
    .collection('contacts')
    .doc(id)
    .update({
      status,
      statusHistory: firestore.FieldValue.arrayUnion(entry),
    })
}

export const updateAdminNote = async (id: string, adminNote: string) =>
  firestore().collection('contacts').doc(id).update({ adminNote })

export const saveAdminFCMToken = async (uid: string, token: string) =>
  firestore()
    .collection('admin_tokens')
    .doc(uid)
    .set({ token, updatedAt: firestore.Timestamp.now() }, { merge: true })
