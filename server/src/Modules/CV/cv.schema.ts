import { Schema, model } from 'mongoose'
import { COLLECTIONS } from '../../Constant/collections'

const cvVersionSchema = new Schema(
  {
    profileData: { type: Schema.Types.Mixed, required: true },
    label: { type: String },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const cvSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: COLLECTIONS.USER, required: true, index: true },
    rawText: { type: String },
    fileName: { type: String },
    profileData: { type: Schema.Types.Mixed },
    versions: { type: [cvVersionSchema], default: [], select: false },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export const CV = model(COLLECTIONS.CV, cvSchema)
