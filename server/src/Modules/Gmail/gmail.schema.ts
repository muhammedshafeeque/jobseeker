import { Schema, model } from 'mongoose'
import { COLLECTIONS } from '../../Constant/collections'

const gmailTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: COLLECTIONS.USER, required: true, index: true },
    email: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiryDate: { type: Number },
    processedMessageIds: { type: [String], default: [] },
    lastSyncAt: { type: Date },
  },
  { timestamps: true },
)

gmailTokenSchema.index({ userId: 1, email: 1 }, { unique: true })

export const GmailToken = model(COLLECTIONS.GMAIL_TOKEN, gmailTokenSchema)
