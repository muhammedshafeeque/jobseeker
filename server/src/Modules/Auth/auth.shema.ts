import { Schema, model } from 'mongoose'
import { COLLECTIONS } from '../../Constant/collections'
const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
)
userSchema.index({ email: 1 }, { unique: true })
export const Users = model(COLLECTIONS.USER, userSchema)