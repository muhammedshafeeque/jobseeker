import express from 'express'
import { AuthController } from '../Modules/Auth/auth.controller'

const router = express.Router()

router.get('/google', AuthController.googleAuthUrl)
router.get('/google/callback', AuthController.googleCallback)
router.post('/exchange', AuthController.exchangeCode)
router.post('/mobile', AuthController.mobileAuth)

export default router
