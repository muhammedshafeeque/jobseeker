import { Schema, model } from 'mongoose'
import { COLLECTIONS } from '../../Constant/collections'

export type ContactStatus =
  | 'unread'
  | 'viewed'
  | 'connected'
  | 'application_sent'
  | 'mail_sent'
  | 'closed'

const statusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    note: { type: String },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const contactSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    message: { type: String, required: true },
    status: { type: String, default: 'unread' },
    statusHistory: { type: [statusHistorySchema], default: [] },
    adminNote: { type: String },
    source: { type: String, default: 'portfolio' },
  },
  { timestamps: true },
)

export const Contact = model(COLLECTIONS.CONTACT, contactSchema)
