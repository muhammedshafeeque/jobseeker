import { Router } from 'express'
import multer from 'multer'
import { CVController } from './cv.controller'
import { requireAuth } from '../../Middleware/auth.middleware'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
const router = Router()

router.use(requireAuth)
router.post('/profile', CVController.saveProfile)
router.post('/upload', upload.single('cv'), CVController.upload)
router.get('/', CVController.get)
router.get('/resume.pdf', CVController.resumePdf)
router.post('/tailor', CVController.tailor)
router.post('/pdf', CVController.tailorPdf)
router.post('/cover-letter/pdf', CVController.coverLetterPdf)

export default router
