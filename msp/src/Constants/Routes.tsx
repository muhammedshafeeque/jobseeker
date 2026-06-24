export const Routes = {
  Login: 'Login',
  Dashboard: 'Dashboard',
  JobTracker: 'JobTracker',
  AddJob: 'AddJob',
  JobAlerts: 'JobAlerts',
  Opportunities: 'Opportunities',
  Enquiries: 'Enquiries',
  EnquiryDetail: 'EnquiryDetail',
  Settings: 'Settings',
} as const
export type RouteNames = (typeof Routes)[keyof typeof Routes]
