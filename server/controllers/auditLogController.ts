import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { ensureUserForAudit } from '../utils/ensureUserForAudit.js'
import { getClientIp } from '../utils/getClientIp.js'

const prisma = new PrismaClient()

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      search,
      limit = '50',
      offset = '0',
      user,
      batchName,
      batchCode,
      action,
      dateFrom,
      dateTo
    } = req.query

    const take = Number(limit)
    const skip = Number(offset)

    const where: any = {}

    if (action && typeof action === 'string') {
      where.action = { contains: action, mode: 'insensitive' }
    }

    if (dateFrom || dateTo) {
      where.timestamp = {}
      if (typeof dateFrom === 'string') {
        where.timestamp.gte = new Date(dateFrom)
      }
      if (typeof dateTo === 'string') {
        where.timestamp.lte = new Date(dateTo)
      }
    }

    // We'll handle user/batch filters after fetch using includes
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        batch: {
          include: {
            product: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take
    })

    // Fetch users for logs where relation is missing but userId exists
    const logsWithUsers = await Promise.all(
      logs.map(async (log) => {
        if (!log.user && log.userId) {
          try {
            const user = await prisma.user.findUnique({
              where: { id: log.userId },
              select: { id: true, firstName: true, lastName: true, email: true }
            })
            if (!user) {
              console.warn(`User ${log.userId} not found in database for audit log ${log.id}. User may need to be synced.`)
            }
            return { ...log, user }
          } catch (error) {
            console.warn(`Failed to fetch user ${log.userId} for audit log ${log.id}:`, error)
            return log
          }
        }
        return log
      })
    )

    // Apply in-memory filters relying on joined fields
    let filtered = logsWithUsers

    if (user && typeof user === 'string') {
      const term = user.toLowerCase()
      filtered = filtered.filter(l => {
        const fullName = l.user ? `${l.user.firstName} ${l.user.lastName}` : ''
        return fullName.toLowerCase().includes(term)
      })
    }

    if (batchCode && typeof batchCode === 'string') {
      const term = batchCode.toLowerCase()
      filtered = filtered.filter(l => l.batch?.batchNumber.toLowerCase().includes(term))
    }

    if (batchName && typeof batchName === 'string') {
      const term = batchName.toLowerCase()
      filtered = filtered.filter(l => l.batch?.product?.productName.toLowerCase().includes(term))
    }

    if (search && typeof search === 'string') {
      const term = search.toLowerCase()
      filtered = filtered.filter(l => {
        const fullName = l.user ? `${l.user.firstName} ${l.user.lastName}` : ''
        const productName = l.batch?.product?.productName || ''
        const code = l.batch?.batchNumber || ''
        return (
          fullName.toLowerCase().includes(term) ||
          productName.toLowerCase().includes(term) ||
          code.toLowerCase().includes(term) ||
          l.action.toLowerCase().includes(term)
        )
      })
    }

    // Fetch template information for template-related audit logs
    const logsWithTemplates = await Promise.all(
      filtered.map(async (log): Promise<typeof log & { template?: { id: string; title: string; description: string | null } | null }> => {
        // Check if this is a template-related entry
        if (log.entityType === 'BatchRecordTemplate' || log.entityType === 'TemplateVersion' || log.entityType === 'TemplateRule') {
          try {
            let template: { id: string; title: string; description: string | null } | null = null
            
            if (log.entityType === 'BatchRecordTemplate') {
              // entityId is the template ID
              template = await prisma.batchRecordTemplate.findUnique({
                where: { id: log.entityId },
                select: { id: true, title: true, description: true }
              })
            } else if (log.entityType === 'TemplateVersion') {
              // entityId is the version ID, need to get template from version
              const version = await prisma.templateVersion.findUnique({
                where: { id: log.entityId },
                select: { templateId: true, template: { select: { id: true, title: true, description: true } } }
              })
              template = version?.template || null
            } else if (log.entityType === 'TemplateRule') {
              // entityId is the rule ID, need to get template from rule
              const rule = await prisma.templateRule.findUnique({
                where: { id: log.entityId },
                select: { templateId: true, template: { select: { id: true, title: true, description: true } } }
              })
              template = rule?.template || null
            }
            
            if (template) {
              return { ...log, template }
            }
          } catch (error) {
            console.warn(`Failed to fetch template for audit log ${log.id} (entityType: ${log.entityType}, entityId: ${log.entityId}):`, error)
          }
        }
        return log as typeof log & { template?: { id: string; title: string; description: string | null } | null }
      })
    )

    const data = logsWithTemplates.map(l => {
      // Debug: Log userId to see if it's available
      if (!l.user && l.userId) {
        console.log(`Audit log ${l.id}: userId=${l.userId} but user not found. Attempting to fetch...`)
      }
      
      // Determine if this is a template-related entry
      const isTemplateEntry = l.entityType === 'BatchRecordTemplate' || l.entityType === 'TemplateVersion' || l.entityType === 'TemplateRule'
      
      return {
        id: l.id,
        timestamp: l.timestamp.toISOString(),
        user: l.user 
          ? `${l.user.firstName} ${l.user.lastName}` 
          : (l.userId 
            ? `User ID: ${l.userId} (not synced)` 
            : 'Unknown User'),
        batchName: isTemplateEntry 
          ? (l.template?.title || '') 
          : (l.batch?.product?.productName || ''),
        batchCode: isTemplateEntry 
          ? (l.template?.id || '') 
          : (l.batch?.batchNumber || ''),
        templateName: isTemplateEntry ? (l.template?.title || '') : undefined,
        templateId: isTemplateEntry ? (l.template?.id || '') : undefined,
        action: l.action,
        entityType: l.entityType,
        details: {
          entityType: l.entityType,
          entityId: l.entityId,
          oldValue: l.oldValue ?? undefined,
          newValue: l.newValue ?? undefined,
          ipAddress: l.ipAddress ?? undefined,
          userAgent: l.userAgent ?? undefined
        }
      }
    })

    res.json({
      success: true,
      data,
      total: data.length,
      limit: take,
      offset: skip
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching audit logs'
    })
  }
}

export const getAuditLogDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'Audit log ID is required' })
    }
    
    let log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: true,
        batch: {
          include: { product: true }
        }
      }
    })

    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log entry not found' })
    }

    // If user relation is missing but userId exists, try to fetch the user
    let user: { id: string; firstName: string; lastName: string; email: string } | null = log.user
    if (!user && log.userId) {
      try {
        const fetchedUser = await prisma.user.findUnique({
          where: { id: log.userId },
          select: { id: true, firstName: true, lastName: true, email: true }
        })
        user = fetchedUser
      } catch (error) {
        console.warn(`Failed to fetch user ${log.userId} for audit log:`, error)
      }
    }

    // Fetch template information if this is a template-related entry
    let template: { id: string; title: string; description: string | null } | null = null
    if (log.entityType === 'BatchRecordTemplate' || log.entityType === 'TemplateVersion' || log.entityType === 'TemplateRule') {
      try {
        if (log.entityType === 'BatchRecordTemplate') {
          template = await prisma.batchRecordTemplate.findUnique({
            where: { id: log.entityId },
            select: { id: true, title: true, description: true }
          })
        } else if (log.entityType === 'TemplateVersion') {
          const version = await prisma.templateVersion.findUnique({
            where: { id: log.entityId },
            select: { templateId: true, template: { select: { id: true, title: true, description: true } } }
          })
          template = version?.template || null
        } else if (log.entityType === 'TemplateRule') {
          const rule = await prisma.templateRule.findUnique({
            where: { id: log.entityId },
            select: { templateId: true, template: { select: { id: true, title: true, description: true } } }
          })
          template = rule?.template || null
        }
      } catch (error) {
        console.warn(`Failed to fetch template for audit log detail ${log.id}:`, error)
      }
    }

    const isTemplateEntry = log.entityType === 'BatchRecordTemplate' || log.entityType === 'TemplateVersion' || log.entityType === 'TemplateRule'

    const entry = {
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      user: user ? `${user.firstName} ${user.lastName}` : (log.userId ? `User ID: ${log.userId}` : 'Unknown User'),
      batchName: isTemplateEntry 
        ? (template?.title || '') 
        : (log.batch?.product?.productName || ''),
      batchCode: isTemplateEntry 
        ? (template?.id || '') 
        : (log.batch?.batchNumber || ''),
      templateName: isTemplateEntry ? (template?.title || '') : undefined,
      templateId: isTemplateEntry ? (template?.id || '') : undefined,
      entityType: log.entityType,
      action: log.action,
      details: {
        entityType: log.entityType,
        entityId: log.entityId,
        oldValue: log.oldValue ?? undefined,
        newValue: log.newValue ?? undefined,
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined
      }
    }

    res.json({ success: true, data: entry })
  } catch (error) {
    console.error('Error fetching audit log detail:', error)
    res.status(500).json({ success: false, message: 'Internal server error while fetching audit log detail' })
  }
}

export const createAuditLog = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      action,
      entityType,
      entityId,
      batchRecordId,
      oldValue,
      newValue
    } = req.body

    if (!action || !entityType || !entityId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: action, entityType, and entityId are required' 
      })
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      })
    }

    const ipAddress = getClientIp(req)
    const userAgent = req.headers['user-agent'] || null

    // Ensure user exists (will auto-sync from JWT if available)
    const { userId: storedUserId, userExists } = await ensureUserForAudit(userId, req as any)

    const auditData: any = {
      action,
      entityType,
      entityId,
      oldValue: oldValue || null,
      newValue: newValue || null,
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

    const auditLog = await prisma.auditLog.create({
      data: auditData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    res.status(201).json({ 
      success: true, 
      data: auditLog 
    })
  } catch (error: any) {
    console.error('Error creating audit log:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while creating audit log',
      error: error.message 
    })
  }
}
