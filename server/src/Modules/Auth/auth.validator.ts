import z from 'zod'

export const registerSchema = z.object({
    name: z.string().min(1),
    email: z.string().email().min(1),
    password: z.string().min(8),
}).strict()

export const loginSchema = z.object({
    email: z.string().email().min(1),
    password: z.string().min(1),
}).strict()