import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { Routes } from '../Constants/Routes'

export interface JobApplication {
  _id: string
  company: string
  role: string
  jd: string
  location?: string
  jobUrl?: string
  maxBudget?: number
  askedBudget?: number
  notes?: string
  status: string
  statusHistory: { status: string; note?: string; changedAt: string }[]
  createdAt: string
  appliedAt?: string
  nextStep?: string
}

export type RootStackParamList = {
  [Routes.Login]: undefined
  [Routes.Dashboard]: undefined
  [Routes.JobTracker]: undefined
  [Routes.AddJob]: { job?: JobApplication } | undefined
  [Routes.JobAlerts]: undefined
  [Routes.Opportunities]: undefined
  [Routes.Enquiries]: undefined
  [Routes.EnquiryDetail]: { enquiryId: string }
  [Routes.Settings]: undefined
}

export type NavigationProp<T extends keyof RootStackParamList> = NativeStackNavigationProp<RootStackParamList, T>
export type ScreenRouteProp<T extends keyof RootStackParamList> = RouteProp<RootStackParamList, T>
