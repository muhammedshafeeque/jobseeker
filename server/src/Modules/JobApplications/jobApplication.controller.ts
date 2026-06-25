import { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import { JobApplication, ApplicationStatus } from './jobApplication.schema'
import { emitToUser } from '../../Config/socket'

export class JobApplicationController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const { company, role, jd, tailoredCV, cvFileName, maxBudget, askedBudget, currency, location, jobUrl, notes } = req.body
      const app = await JobApplication.create({
        userId, company, role, jd, tailoredCV, cvFileName,
        maxBudget, askedBudget, currency, location, jobUrl, notes,
        status: 'draft',
        statusHistory: [{ status: 'draft', note: 'Created' }],
      })
      emitToUser(userId, 'job:created', app)
      res.status(201).json(app)
    } catch (e) {
      next(e)
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const status = req.query.status as string | undefined
      const filter = status ? { userId, status } : { userId }
      const apps = await JobApplication.find(filter).sort({ createdAt: -1 })
      res.json(apps)
    } catch (e) {
      next(e)
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const app = await JobApplication.findOne({ _id: req.params.id, userId })
      if (!app) return res.status(404).json({ message: 'Not found' })
      res.json(app)
    } catch (e) {
      next(e)
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const app = await JobApplication.findOneAndUpdate(
        { _id: req.params.id, userId },
        req.body,
        { new: true },
      )
      if (!app) return res.status(404).json({ message: 'Not found' })
      emitToUser(userId, 'job:updated', app)
      res.json(app)
    } catch (e) {
      next(e)
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const { status, note } = req.body as { status: ApplicationStatus; note?: string }
      const app = await JobApplication.findOne({ _id: req.params.id, userId })
      if (!app) return res.status(404).json({ message: 'Not found' })
      app.status = status
      app.statusHistory.push({ status, note, changedAt: new Date() } as any)
      if (status === 'applied' && !app.appliedAt) app.appliedAt = new Date()
      await app.save()
      emitToUser(userId, 'job:updated', app)
      res.json(app)
    } catch (e) {
      next(e)
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      await JobApplication.findOneAndDelete({ _id: req.params.id, userId })
      emitToUser(userId, 'job:deleted', { id: req.params.id })
      res.json({ message: 'Deleted' })
    } catch (e) {
      next(e)
    }
  }

  static async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const counts = await JobApplication.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      const total = await JobApplication.countDocuments({ userId })
      res.json({ total, byStatus: counts })
    } catch (e) {
      next(e)
    }
  }

  static async analytics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const uid = new Types.ObjectId(userId)
      const all = await JobApplication.find({ userId }).lean()

      const byStatus = await JobApplication.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])

      const statusMap: Record<string, number> = Object.fromEntries(byStatus.map(s => [s._id, s.count]))
      const total = all.length
      const activeStatuses = ['applied','responded','phone_screen','code_test','interview_1','interview_2','interview_3']
      const positiveStatuses = ['responded','phone_screen','code_test','interview_1','interview_2','interview_3','offer','accepted']
      const applied = all.filter(a => a.appliedAt)
      const responseRate = applied.length
        ? Math.round((all.filter(a => positiveStatuses.includes(a.status)).length / applied.length) * 100)
        : 0

      // Average days to first response (draft → applied → responded)
      const respondedApps = all.filter(a => {
        const hist = a.statusHistory ?? []
        return hist.some((h: any) => positiveStatuses.includes(h.status)) && a.appliedAt
      })
      let avgDaysToResponse: number | null = null
      if (respondedApps.length) {
        const totalDays = respondedApps.reduce((acc, a) => {
          const hist = (a.statusHistory ?? []) as any[]
          const firstPositive = hist.find((h: any) => positiveStatuses.includes(h.status))
          if (!firstPositive || !a.appliedAt) return acc
          return acc + Math.round((new Date(firstPositive.changedAt).getTime() - new Date(a.appliedAt).getTime()) / 86400000)
        }, 0)
        avgDaysToResponse = Math.round(totalDays / respondedApps.length)
      }

      // Applications per week (last 8 weeks)
      const now = Date.now()
      const weeklyData = Array.from({ length: 8 }, (_, i) => {
        const weekStart = now - (7 - i) * 7 * 86400000
        const weekEnd = weekStart + 7 * 86400000
        return {
          week: new Date(weekStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          count: all.filter(a => {
            const t = new Date(a.createdAt as Date).getTime()
            return t >= weekStart && t < weekEnd
          }).length,
        }
      })

      // Follow-up needed: applied > 7 days ago, no positive response
      const followUpNeeded = all.filter(a => {
        if (a.status !== 'applied' || !a.appliedAt) return false
        const days = Math.floor((Date.now() - new Date(a.appliedAt).getTime()) / 86400000)
        return days >= 7
      }).length

      // Rejection reasons
      const rejectionReasons = all
        .filter(a => a.status === 'rejected' && (a as any).rejectionReason)
        .map((a: any) => a.rejectionReason)

      res.json({
        total,
        byStatus: statusMap,
        responseRate,
        avgDaysToResponse,
        weeklyData,
        followUpNeeded,
        rejectionReasons,
        activeCount: all.filter(a => activeStatuses.includes(a.status)).length,
        offersCount: (statusMap['offer'] ?? 0) + (statusMap['accepted'] ?? 0),
      })
    } catch (e) {
      next(e)
    }
  }

  static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      const apps = await JobApplication.find({ userId }).lean()

      const headers = ['Company','Role','Status','Location','Max Budget','Asked Budget','Applied At','Interview Date','Follow Up At','Rejection Reason','Job URL','Notes','Created At']
      const rows = apps.map(a => [
        a.company, a.role, a.status, a.location ?? '',
        a.maxBudget ?? '', a.askedBudget ?? '',
        a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : '',
        (a as any).interviewDate ? new Date((a as any).interviewDate).toLocaleDateString() : '',
        (a as any).followUpAt ? new Date((a as any).followUpAt).toLocaleDateString() : '',
        (a as any).rejectionReason ?? '',
        a.jobUrl ?? '', (a.notes ?? '').replace(/\n/g, ' '),
        new Date(a.createdAt as Date).toLocaleDateString(),
      ].map(v => `"${String(v).replace(/"/g, '""')}"`))

      const csv = [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\n')
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="JobApplications_${new Date().toISOString().slice(0,10)}.csv"`)
      res.send(csv)
    } catch (e) {
      next(e)
    }
  }
}
