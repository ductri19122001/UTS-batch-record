import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getClientIp } from "../utils/getClientIp.js";
import { ensureUserForAudit } from "../utils/ensureUserForAudit.js";
import { createApprovalRequest, getApprovalRequests, approveSectionForChanges, getApprovalRequestById, rejectApprovalRequest, updateBatchStatus } from "../services/batchRecordSectionServices.js";
const prisma = new PrismaClient();

export async function createApprovalRequestHandler(req: Request, res: Response) {
  const {
    batchRecordId,
    sectionId,
    requestType,
    reason,
    description,
    userId,
    existingData,
    proposedData,
    parentSectionId
  } = req.body

  if (!batchRecordId || !sectionId || !requestType || !reason || !userId) {
    return res.status(400).json({
      error: 'Missing required fields: batchRecordId, sectionId, requestType, reason, userId'
    })
  }

  try {
    const ipAddress = getClientIp(req);
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    const result = await createApprovalRequest(
      batchRecordId,
      sectionId,
      requestType,
      reason,
      description ?? null,
      userId,
      existingData ?? undefined,
      proposedData ?? undefined,
      parentSectionId ?? null,
      ipAddress,
      userAgent,
      req
    )
    updateBatchStatus(batchRecordId)
    return res.status(201).json(result)
  } catch (error) {
    console.error('Create approval request error:', error)
    return res.status(500).json({ error: 'Failed to create approval request' })
  }
}

export async function getApprovalRequestsHandler(req: Request, res: Response) {
  const { batchRecordId } = req.params

  if (!batchRecordId) {
    return res.status(400).json({ error: 'Missing required field: batchRecordId' })
  }

  try {
    const requests = await getApprovalRequests(batchRecordId)
    res.status(200).json(requests)
  } catch (error) {
    console.error('Get approval requests error:', error)
    res.status(500).json({ error: 'Failed to fetch approval requests' })
  }
}

export async function getApprovalRequestByIdHandler(req: Request, res: Response) {
  const { requestId } = req.params

  if (!requestId) {
    return res.status(400).json({ error: 'Missing required field: requestId' })
  }

  try {
    const request = await getApprovalRequestById(requestId)
    if (!request) {
      return res.status(404).json({ error: 'Approval request not found' })
    }
    res.status(200).json(request)
  } catch (error) {
    console.error('Get approval request by ID error:', error)
    res.status(500).json({ error: 'Failed to fetch approval request' })
  }
}

export async function approveChangeRequestHandler(req: Request, res: Response) {
  const { requestId } = req.params
  const { batchRecordId, sectionId, reviewedBy, reviewComments } = req.body

  if (!requestId || !batchRecordId || !sectionId || !reviewedBy) {
    return res.status(400).json({
      error: 'Missing required fields: requestId, batchRecordId, sectionId, reviewedBy'
    })
  }

  try {
    const result = await approveSectionForChanges(
      batchRecordId,
      sectionId,
      requestId,
      reviewedBy,
      reviewComments
    )
    const signatureId = req.body?.signatureId

    const { userId: storedUserId, userExists } = await ensureUserForAudit(reviewedBy, req as any)

    const auditData: any = {
      action: 'APPROVAL_SIGNED',
      entityType: 'ApprovalRequest',
      entityId: requestId,
      newValue: { status: 'APPROVED', sectionId, signatureId, reviewComments },
      ipAddress: getClientIp(req) || null,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
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

    updateBatchStatus(batchRecordId)
    res.status(200).json(result)
  } catch (error) {
    console.error('Approve change request error:', error)
    res.status(500).json({ error: 'Failed to approve change request' })
  }
}

export async function rejectApprovalRequestHandler(req: Request, res: Response) {
  const { requestId } = req.params
  const { batchRecordId, sectionId, reviewedBy, reviewComments } = req.body

  if (!requestId || !batchRecordId || !sectionId || !reviewedBy) {
    return res.status(400).json({
      error: 'Missing required fields: requestId, batchRecordId, sectionId, reviewedBy'
    })
  }

  try {
    const result = await rejectApprovalRequest(
      batchRecordId,
      sectionId,
      requestId,
      reviewedBy,
      reviewComments
    )
    res.status(200).json(result)
  } catch (error) {
    console.error('Reject approval request error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to reject approval request'
    res.status(500).json({ error: errorMessage })
  }
}
