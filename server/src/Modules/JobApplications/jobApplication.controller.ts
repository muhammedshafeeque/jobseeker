import { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import { JobApplication, ApplicationStatus } from './jobApplication.schema'
import { getIO } from '../../Config/socket'

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
      getIO().emit('job:created', app)
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
      getIO().emit('job:updated', app)
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
      getIO().emit('job:updated', app)
      res.json(app)
    } catch (e) {
      next(e)
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId
      await JobApplication.findOneAndDelete({ _id: req.params.id, userId })
      getIO().emit('job:deleted', { id: req.params.id })
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
}
