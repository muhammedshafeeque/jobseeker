import { Request, Response, NextFunction } from 'express'
import { Contact } from './contact.schema'
import { getIO } from '../../Config/socket'

export class ContactController {
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, message } = req.body
      if (!name || !email || !message) throw { status: 400, message: 'name, email, and message are required' }
      const contact = await Contact.create({
        name, email, phone, message,
        status: 'unread',
        statusHistory: [{ status: 'unread', note: 'New enquiry received' }],
      })
      getIO().emit('contact:new', contact)
      res.status(201).json({ message: 'Enquiry received' })
    } catch (e) {
      next(e)
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined
      const filter = status ? { status } : {}
      const contacts = await Contact.find(filter).sort({ createdAt: -1 })
      res.json(contacts)
    } catch (e) {
      next(e)
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const contact = await Contact.findById(req.params.id)
      if (!contact) return res.status(404).json({ message: 'Not found' })
      res.json(contact)
    } catch (e) {
      next(e)
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, note } = req.body
      const contact = await Contact.findById(req.params.id)
      if (!contact) return res.status(404).json({ message: 'Not found' })
      contact.status = status
      contact.statusHistory.push({ status, note, changedAt: new Date() } as any)
      await contact.save()
      getIO().emit('contact:updated', contact)
      res.json(contact)
    } catch (e) {
      next(e)
    }
  }

  static async updateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { adminNote } = req.body
      const contact = await Contact.findByIdAndUpdate(req.params.id, { adminNote }, { new: true })
      if (!contact) return res.status(404).json({ message: 'Not found' })
      res.json(contact)
    } catch (e) {
      next(e)
    }
  }

  static async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const counts = await Contact.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
      const total = await Contact.countDocuments()
      res.json({ total, byStatus: counts })
    } catch (e) {
      next(e)
    }
  }
}
