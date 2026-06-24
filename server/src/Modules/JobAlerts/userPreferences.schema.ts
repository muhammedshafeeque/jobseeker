import { Schema, model } from 'mongoose'
import { COLLECTIONS } from '../../Constant/collections'

const schema = new Schema(
  {
    skills: { type: [String], default: [] },
    jobTitles: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0 },
    expectedCTCMin: { type: Number },
    expectedCTCMax: { type: Number },
    preferredLocations: { type: [String], default: ['Bangalore'] },
  },
  { timestamps: true },
)

export const UserPreferences = model(COLLECTIONS.USER_PREFERENCES, schema)
