import * as bcrypt from 'bcrypt'
import { NextFunction } from 'express'
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10)
}

export const comparePassword = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword)
}

export const validateBody = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.safeParse(req.body)
        if (error) {
            return res.status(400).json({ message: error.message })
        }
        next()
    }
}

export const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '8h' })
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, process.env.JWT_SECRET as string)
}

export const sendEmail = async (
    email: string,
    subject: string,
    text: string,
    html?: string,
) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })

    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject,
        text,
        html: html ?? text,
    })
}