import { Schema, model } from 'mongoose'
import { COLLECTIONS } from '../../Constant/collections'

const cvTemplateSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
)

export const CVTemplate = model(COLLECTIONS.CV_TEMPLATE, cvTemplateSchema)
