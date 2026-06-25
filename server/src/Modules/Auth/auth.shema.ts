import { Schema, model } from 'mongoose'
import { COLLECTIONS } from '../../Constant/collections'

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    googleId: { type: String },
    picture: { type: String },
  },
  { timestamps: true },
)

export const Users = model(COLLECTIONS.USER, userSchema)