import { Schema, model } from 'mongoose'
import { COLLECTIONS } from '../../Constant/collections'

const schema = new Schema(
  {
    title: { type: String, required: true },
    company: { type: String },
    location: { type: String },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    experienceMin: { type: Number },
    experienceMax: { type: Number },
    url: { type: String },
    source: {
      type: String,
      enum: ['indeed', 'naukri', 'linkedin', 'gmail', 'manual'],
      required: true,
    },
    snippet: { type: String },
    body: { type: String },
    htmlBody: { type: String },
    isRead: { type: Boolean, default: false },
    isSaved: { type: Boolean, default: false },
    isDismissed: { type: Boolean, default: false },
    appliedJobId: { type: Schema.Types.ObjectId, ref: COLLECTIONS.JOB_APPLICATION },
    postedAt: { type: Date },
    externalId: { type: String },
  },
  { timestamps: true },
)

schema.index({ externalId: 1 }, { unique: true, sparse: true })

export const JobAlert = model(COLLECTIONS.JOB_ALERT, schema)
