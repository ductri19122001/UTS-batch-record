import type { Request, Response } from 'express'
import { createElectronicSignature } from '../services/signatureServices.js'
import { PrismaClient } from '@prisma/client'
import { getClientIp } from '../utils/getClientIp.js'
import { ensureUserForAudit } from '../utils/ensureUserForAudit.js'

const prisma = new PrismaClient()

export const postSignature = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      entityType,
      entityId,
      canonicalPayload,
      batchRecordId,
      sectionRecordId
    } = req.body || {}

    if (!userId || !entityType || !entityId || !canonicalPayload) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const ipAddress = getClientIp(req)
    const userAgent = req.headers['user-agent']

    const sig = await createElectronicSignature({
      userId,
      entityType,
      entityId,
      canonicalPayload,
      batchRecordId,
      sectionRecordId,
      ipAddress: ipAddress || '',
      userAgent: typeof userAgent === 'string' ? userAgent : ''
    })

    // Audit log for signature creation
    // Ensure user exists (will auto-sync from JWT if available)
    const { userId: storedUserId, userExists } = await ensureUserForAudit(userId, req as any)

    const auditData: any = {
      action: 'SIGNATURE_CREATED',
      entityType,
      entityId,
      newValue: { signatureId: sig.id },
      ipAddress: ipAddress || null,
      userAgent: typeof userAgent === 'string' ? userAgent : null,
    }
    
    if (storedUserId && userExists) {
      auditData.user = { connect: { id: storedUserId } }
    } else {
      auditData.userId = storedUserId || null
    }
    
    if (batchRecordId) {
      auditData.batch = { connect: { id: batchRecordId } }
    }
    
    await prisma.auditLog.create({
      data: auditData
    })

    return res.json({ success: true, data: { id: sig.id, createdAt: sig.createdAt } })
  } catch (error) {
    console.error('Error creating signature', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}


