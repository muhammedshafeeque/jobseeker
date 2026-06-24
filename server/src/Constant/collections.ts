export const COLLECTIONS = {
  USER: 'user',
  CV: 'cv',
  JOB_APPLICATION: 'job_application',
  CONTACT: 'contact',
  GMAIL_TOKEN: 'gmail_token',
  JOB_ALERT: 'job_alert',
  USER_PREFERENCES: 'user_preferences',
} as const

export type CollectionNames = (typeof COLLECTIONS)[keyof typeof COLLECTIONS]