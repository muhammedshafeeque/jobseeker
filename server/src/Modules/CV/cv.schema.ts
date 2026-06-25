import { Schema, model } from 'mongoose'
import { COLLECTIONS } from '../../Constant/collections'

const cvSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: COLLECTIONS.USER, required: true, index: true },
    rawText: { type: String },
    fileName: { type: String },
    profileData: { type: Schema.Types.Mixed },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export const CV = model(COLLECTIONS.CV, cvSchema)
