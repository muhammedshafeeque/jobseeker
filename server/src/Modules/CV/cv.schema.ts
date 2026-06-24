import { Schema, model } from 'mongoose'
import { COLLECTIONS } from '../../Constant/collections'

const cvSchema = new Schema(
  {
    rawText: { type: String, required: true },
    fileName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export const CV = model(COLLECTIONS.CV, cvSchema)
