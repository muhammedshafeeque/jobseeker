import { Router } from 'express'
import { JobApplicationController } from './jobApplication.controller'
import { requireAuth } from '../../Middleware/auth.middleware'
import { validate, jobCreateSchema, jobUpdateSchema, jobStatusSchema } from '../../Utils/validation'

const router = Router()
router.use(requireAuth)

router.get('/stats', JobApplicationController.stats)
router.get('/analytics', JobApplicationController.analytics)
router.get('/export', JobApplicationController.exportCsv)
router.get('/', JobApplicationController.list)
router.post('/', validate(jobCreateSchema), JobApplicationController.create)
router.get('/:id/emails', JobApplicationController.getEmails)
router.get('/:id', JobApplicationController.getOne)
router.put('/:id', validate(jobUpdateSchema), JobApplicationController.update)
router.patch('/:id/status', validate(jobStatusSchema), JobApplicationController.updateStatus)
router.delete('/:id', JobApplicationController.remove)

export default router
