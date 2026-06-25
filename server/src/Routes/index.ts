import express from 'express'
import authRoute from './auth.route'
import cvRoute from '../Modules/CV/cv.route'
import cvTemplateRoute from '../Modules/CVTemplates/cvTemplate.route'
import jobRoute from '../Modules/JobApplications/jobApplication.route'
import contactRoute from '../Modules/Contacts/contact.route'
import gmailRoute from '../Modules/Gmail/gmail.route'
import jobAlertRoute from '../Modules/JobAlerts/jobAlert.route'

const router = express.Router()

router.use('/auth', authRoute)
router.use('/cv', cvRoute)
router.use('/cv-templates', cvTemplateRoute)
router.use('/jobs', jobRoute)
router.use('/contacts', contactRoute)
router.use('/gmail', gmailRoute)
router.use('/job-alerts', jobAlertRoute)

export default router
