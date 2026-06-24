import { Router } from 'express'
import { GmailController } from './gmail.controller'
import { requireAuth } from '../../Middleware/auth.middleware'

const router = Router()

// OAuth callback is public (Google redirects here)
router.get('/callback', GmailController.callback)

router.use(requireAuth)
router.get('/auth-url', GmailController.authUrl)
router.get('/status', GmailController.status)
router.delete('/disconnect', GmailController.disconnect)
router.post('/sync', GmailController.sync)

export default router
