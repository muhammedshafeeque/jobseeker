import { Router } from 'express'
import multer from 'multer'
import { CVController } from './cv.controller'
import { requireAuth } from '../../Middleware/auth.middleware'
import { validate, aiJdSchema } from '../../Utils/validation'

// Only allow PDF and DOCX; reject everything else before it hits the controller
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true)
    else cb(new Error('Only PDF and DOCX files are accepted'))
  },
})

const router = Router()

router.use(requireAuth)
router.post('/profile', CVController.saveProfile)
router.post('/upload', upload.single('cv'), CVController.upload)
router.get('/', CVController.get)
router.get('/resume.pdf', CVController.resumePdf)
router.post('/tailor', validate(aiJdSchema), CVController.tailor)
router.post('/pdf', CVController.tailorPdf)
router.post('/cover-letter/pdf', validate(aiJdSchema), CVController.coverLetterPdf)
router.post('/cover-letter/text', validate(aiJdSchema), CVController.coverLetterText)
router.post('/ats-score', validate(aiJdSchema), CVController.atsScore)
router.post('/interview-prep', validate(aiJdSchema), CVController.interviewPrep)
router.get('/versions', CVController.listVersions)
router.post('/versions/restore/:index', CVController.restoreVersion)

export default router
