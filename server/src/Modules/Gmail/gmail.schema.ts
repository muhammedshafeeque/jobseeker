import { Schema, model } from 'mongoose'
import { COLLECTIONS } from '../../Constant/collections'

const gmailTokenSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiryDate: { type: Number },
    processedMessageIds: { type: [String], default: [] },
    lastSyncAt: { type: Date },
  },
  { timestamps: true },
)

export const GmailToken = model(COLLECTIONS.GMAIL_TOKEN, gmailTokenSchema)
