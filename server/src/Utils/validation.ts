import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

export const validate = (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({ message: result.error.issues[0]?.message ?? 'Invalid request' })
    }
    req.body = result.data // replace body with parsed (strips unknown keys)
    next()
  }

const JD_MAX = 20_000   // chars — stops abuse of AI endpoints
const NOTE_MAX = 5_000
const STR = z.string().trim()
const OPT_STR = STR.optional()
const MONEY = z.number().positive().optional()

// Allowed status values
const STATUS_VALUES = [
  'draft', 'applied', 'responded', 'phone_screen', 'code_test',
  'interview_1', 'interview_2', 'interview_3', 'offer', 'accepted',
  'rejected', 'withdrawn',
] as const

export const jobCreateSchema = z.object({
  company:      STR.min(1).max(200),
  role:         STR.min(1).max(200),
  jd:           STR.min(1).max(JD_MAX),
  maxBudget:    MONEY,
  askedBudget:  MONEY,
  currency:     STR.max(10).default('INR'),
  location:     OPT_STR.refine(v => !v || v.length <= 200),
  jobUrl:       z.string().trim().url().optional().or(z.literal('')),
  notes:        OPT_STR.refine(v => !v || v.length <= NOTE_MAX),
})

export const jobUpdateSchema = z.object({
  company:         OPT_STR.refine(v => !v || v.length <= 200),
  role:            OPT_STR.refine(v => !v || v.length <= 200),
  jd:              OPT_STR.refine(v => !v || v.length <= JD_MAX),
  maxBudget:       MONEY,
  askedBudget:     MONEY,
  currency:        OPT_STR.refine(v => !v || v.length <= 10),
  location:        OPT_STR.refine(v => !v || v.length <= 200),
  jobUrl:          z.string().trim().url().optional().or(z.literal('')),
  notes:           OPT_STR.refine(v => !v || v.length <= NOTE_MAX),
  tailoredCV:      OPT_STR.refine(v => !v || v.length <= 100_000),
  cvFileName:      OPT_STR.refine(v => !v || v.length <= 300),
  nextStep:        OPT_STR.refine(v => !v || v.length <= 500),
  appliedAt:       z.coerce.date().optional(),
  followUpAt:      z.coerce.date().optional(),
  interviewDate:   z.coerce.date().optional(),
  rejectionReason: OPT_STR.refine(v => !v || v.length <= 500),
})

export const jobStatusSchema = z.object({
  status: z.enum(STATUS_VALUES),
  note:   OPT_STR.refine(v => !v || v.length <= 500),
})

export const aiJdSchema = z.object({
  jd:      STR.min(10).max(JD_MAX),
  company: OPT_STR.refine(v => !v || v.length <= 200),
  role:    OPT_STR.refine(v => !v || v.length <= 200),
})
