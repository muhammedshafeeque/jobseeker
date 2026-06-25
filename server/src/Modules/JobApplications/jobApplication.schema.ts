import { Schema, model } from 'mongoose'
import { COLLECTIONS } from '../../Constant/collections'

export type ApplicationStatus =
  | 'draft'
  | 'applied'
  | 'responded'
  | 'phone_screen'
  | 'code_test'
  | 'interview_1'
  | 'interview_2'
  | 'interview_3'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

const statusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    note: { type: String },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const jobApplicationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: COLLECTIONS.USER, required: true, index: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    jd: { type: String, required: true },
    tailoredCV: { type: String },
    cvFileName: { type: String },
    maxBudget: { type: Number },
    askedBudget: { type: Number },
    currency: { type: String, default: 'INR' },
    location: { type: String },
    jobUrl: { type: String },
    status: { type: String, default: 'draft' },
    statusHistory: { type: [statusHistorySchema], default: [] },
    gmailThreadIds: { type: [String], default: [] },
    notes: { type: String },
    appliedAt: { type: Date },
    nextStep: { type: String },
  },
  { timestamps: true },
)

export const JobApplication = model(COLLECTIONS.JOB_APPLICATION, jobApplicationSchema)
