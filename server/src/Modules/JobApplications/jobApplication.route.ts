import { Router } from 'express'
import { JobApplicationController } from './jobApplication.controller'
import { requireAuth } from '../../Middleware/auth.middleware'

const router = Router()
router.use(requireAuth)

router.get('/stats', JobApplicationController.stats)
router.get('/', JobApplicationController.list)
router.post('/', JobApplicationController.create)
router.get('/:id', JobApplicationController.getOne)
router.put('/:id', JobApplicationController.update)
router.patch('/:id/status', JobApplicationController.updateStatus)
router.delete('/:id', JobApplicationController.remove)

export default router
