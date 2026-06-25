import { Router } from 'express'
import { CVController } from '../CV/cv.controller'
import { requireAuth } from '../../Middleware/auth.middleware'

const router = Router()

router.use(requireAuth)
router.get('/', CVController.listTemplates)
router.get('/:id', CVController.getTemplate)

export default router
