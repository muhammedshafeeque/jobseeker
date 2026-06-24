import { Router } from 'express'
import { ContactController } from './contact.controller'
import { requireAuth } from '../../Middleware/auth.middleware'

const router = Router()

// Public — portfolio contact form posts here
router.post('/', ContactController.submit)

// Protected — admin reads/manages
router.use(requireAuth)
router.get('/stats', ContactController.stats)
router.get('/', ContactController.list)
router.get('/:id', ContactController.getOne)
router.patch('/:id/status', ContactController.updateStatus)
router.patch('/:id/note', ContactController.updateNote)

export default router
