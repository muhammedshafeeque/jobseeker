import { Router } from 'express'
import { JobAlertController } from './jobAlert.controller'
import { requireAuth } from '../../Middleware/auth.middleware'

const router = Router()
router.use(requireAuth)

router.get('/preferences', JobAlertController.getPreferences)
router.put('/preferences', JobAlertController.updatePreferences)
router.get('/opportunities', JobAlertController.opportunities)
router.get('/', JobAlertController.list)
router.post('/sync', JobAlertController.sync)
router.get('/:id', JobAlertController.getOne)
router.patch('/:id/read', JobAlertController.markRead)
router.patch('/:id/save', JobAlertController.toggleSave)
router.patch('/:id/dismiss', JobAlertController.dismiss)
router.post('/:id/apply', JobAlertController.convertToApplication)
router.delete('/:id', JobAlertController.remove)

export default router
