import { NextFunction, Request, Response } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.status) {
        return res.status(Number(err.status)).json({ message: err.message })
    }
    console.error(err)
    return res.status(Number(500)).json({ message: 'Internal server error' })   
}