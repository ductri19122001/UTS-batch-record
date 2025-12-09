import { PrismaClient, SectionStatus, SectionType } from "@prisma/client";
import type { BatchRecord, BatchRecordSection } from "@prisma/client";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { getSectionRules } from "../services/templateServices.js";
import type { Request } from 'express';
import { ensureUserForAudit } from '../utils/ensureUserForAudit.js';

const prisma = new PrismaClient()

type TemplateSectionDefinition = {
  id: string;
  subsections?: TemplateSectionDefinition[];
};

const isJsonEmpty = (value: InputJsonValue | null | undefined): boolean => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value !== "object") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return Object.keys(value as Record<string, unknown>).length === 0;
};

const isPlaceholderRecord = (
  section:
    | {
        status: SectionStatus;
        sectionData: InputJsonValue | null;
      }
    | null
    | undefined
) => {
  if (!section) {
    return false;
  }

  if (section.status !== SectionStatus.DRAFT) {
    return false;
  }

  return isJsonEmpty(section.sectionData);
};

async function ensureSectionsRecursive(
  batchRecordId: string,
  sections: TemplateSectionDefinition[],
  parentSectionRecordId: string | null
): Promise<void> {
  for (const section of sections) {
    let activeRecord = await prisma.batchRecordSection.findFirst({
      where: {
        batchRecordId,
        sectionId: section.id,
        parentSectionId: parentSectionRecordId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!activeRecord) {
      activeRecord = await prisma.batchRecordSection.create({
        data: {
          batchRecordId,
          sectionId: section.id,
          parentSectionId: parentSectionRecordId,
          sectionType: parentSectionRecordId ? SectionType.SUBSECTION : SectionType.SECTION,
          status: SectionStatus.DRAFT,
          sectionData: {},
        },
        select: { id: true },
      });
    }

    if (Array.isArray(section.subsections) && section.subsections.length > 0) {
      await ensureSectionsRecursive(batchRecordId, section.subsections, activeRecord.id);
    }
  }
}

async function ensureBatchSectionStructure(
  batchRecordId: string
): Promise<TemplateSectionDefinition[]> {
  const batchRecord = await prisma.batchRecord.findUnique({
    where: { id: batchRecordId },
    select: { templateVersionId: true },
  });

  if (!batchRecord?.templateVersionId) {
    return [];
  }

  const templateVersion = await prisma.templateVersion.findUnique({
    where: { id: batchRecord.templateVersionId },
    select: { data: true },
  });

  const templateData = templateVersion?.data as { sections?: TemplateSectionDefinition[] } | null;
  const sections = Array.isArray(templateData?.sections) ? templateData!.sections : [];

  if (sections.length > 0) {
    await ensureSectionsRecursive(batchRecordId, sections, null);
  }

  return sections;
}

interface SectionDependencyData {
  sourceSectionId?: string;
  dependsOn?: string;
  condition?: string;
  message?: string;
}

async function createSectionAuditLog(
  batchRecordId: string,
  sectionId: string,
  userId: string,
  action: string,
  oldValue: any = null,
  newValue: any,
  ipAddress?: string,
  userAgent?: string,
  req?: Request
) {
  const { userId: storedUserId, userExists } = await ensureUserForAudit(userId, req as any)

  const auditData: any = {
    action,
    entityType: 'BatchRecordSection',
    entityId: sectionId,
    oldValue: oldValue,
    newValue: newValue,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
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
}

export async function updateBatchStatus(batchRecordId: string): Promise<BatchRecord | null> {
  const sections = await prisma.batchRecordSection.findMany({
    where:
    {
      batchRecordId,
      sectionType: 'SECTION',
      isActive: true
    },
    select: { status: true }
  })

  console.log(`Updating batch status, found ${sections.length} top - level sections`)
  console.log('Section statuses:', sections.map(s => s.status))
  const completed = sections.length > 0 && sections.every(
    section => section.status === SectionStatus.COMPLETED ||
      section.status === SectionStatus.APPROVED ||
      section.status === SectionStatus.APPROVED_FOR_CHANGE
  )

  console.log(`All top-level sections completed: ${completed}`)

  if (completed) {
    const batchRecord = await prisma.batchRecord.update({
      where: { id: batchRecordId },
      data: { status: 'COMPLETED' }
    })

    return batchRecord
  }

  return null

}

export async function getBatchRecordSectionsById(batchRecordId: string): Promise<BatchRecordSection[] | null> {
  const sections = await prisma.batchRecordSection.findMany({
    where: {
      batchRecordId,
      isActive: true
    },
  })
  return sections
}

export async function getBatchRecordSectionWithAllChildren(batchRecordId: string, sectionId: string): Promise<BatchRecordSection | null> {
  const section = await prisma.batchRecordSection.findFirst({
    where: {
      sectionId: sectionId,
      batchRecordId: batchRecordId,
      isActive: true
    }
  })

  if (!section) return null

  // Recursively fetch all children
  const populateChildren = async (parentId: string): Promise<any[]> => {
    const children = await prisma.batchRecordSection.findMany({
      where: {
        parentSectionId: parentId,
        batchRecordId: batchRecordId,
        isActive: true
      }
    })

    const populatedChildren = []
    for (const child of children) {
      const childWithSubsections = {
        ...child,
        childSections: await populateChildren(child.id)
      }
      populatedChildren.push(childWithSubsections)
    }
    return populatedChildren
  }

  return {
    ...section,
    childSections: await populateChildren(section.id)
  } as BatchRecordSection
}


interface SectionDependencyData {
  sourceSectionId?: string;
  dependsOn?: string;
  condition?: string;
  message?: string;
}

const checkSectionDependencies = async (sectionId: string, batchRecordId: string) => {
  const batchRecord = await prisma.batchRecord.findUnique({ where: { id: batchRecordId } })

  if (!batchRecord) {
    return {
      ok: false,
      message: `Batch record not found.`
    }
  }

  const rules = await getSectionRules(
    batchRecord.templateId,
    sectionId,
  )

  const dependencyRules = rules.filter(rule => rule.ruleType === 'SECTION_DEPENDENCY')

  const conditionSatisfied = (status: SectionStatus | null | undefined, condition?: string) => {
    if (!status || !condition) return false
    const normalizedStatus = status.toString().toUpperCase()
    const normalizedCondition = condition.toString().toUpperCase()

    if (normalizedCondition === 'COMPLETED') {
      return ['COMPLETED', 'PENDING_APPROVAL', 'APPROVED_FOR_CHANGE', 'APPROVED'].includes(normalizedStatus)
    }

    if (normalizedCondition === 'APPROVED') {
      return ['APPROVED', 'APPROVED_FOR_CHANGE'].includes(normalizedStatus)
    }

    return normalizedStatus === normalizedCondition
  }

  for (const rule of dependencyRules) {
    const data = rule.ruleData as SectionDependencyData
    const dependencySectionId = data.sourceSectionId ?? data.dependsOn
    if (!dependencySectionId) {
      continue
    }

    const dependencySection = await prisma.batchRecordSection.findFirst({
      where: {
        batchRecordId,
        sectionId: dependencySectionId,
        isActive: true
      }
    })

    if (!dependencySection || !conditionSatisfied(dependencySection.status, data.condition)) {
      return {
        ok: false,
        message: `Section dependency not met: Section '${dependencySectionId}' must be '${data.condition ?? 'completed'}' before changes can be made to this section.`
      }
    }
  }

  return {
    ok: true
  }
}

// Create immutable section version (never updates existing records)
export async function createImmutableBatchRecordSection(
  batchRecordId: string,
  sectionId: string,
  sectionData: any,
  userId: string,
  parentSectionId?: string,
  ipAddress?: string,
  userAgent?: string,
  sectionStatus: SectionStatus = SectionStatus.COMPLETED,
  bypassLocks = false,
  req?: Request
): Promise<BatchRecordSection> {
  await ensureBatchSectionStructure(batchRecordId);

  const existingSections = await prisma.batchRecordSection.findMany({
    where: {
      sectionId,
      batchRecordId
    },
    orderBy: { version: 'desc' },
  })

  const getLockData = (status: SectionStatus | string) => {
    return status === SectionStatus.COMPLETED ?
      {
        lockedAt: new Date(),
        lockedBy: userId,
        completedBy: userId,
        completedAt: new Date()
      }
      :
      {
        lockedAt: null,
        lockedBy: null,
        completedBy: null,
        completedAt: null
      }
  }

  const activeSection = existingSections.find(section => section.isActive)
  const highestVersion = existingSections.length > 0 ? existingSections[0]?.version || 0 : 0

  if (
    activeSection &&
    isPlaceholderRecord(activeSection) &&
    sectionStatus === SectionStatus.DRAFT &&
    isJsonEmpty(sectionData)
  ) {
    const placeholderRecord = await prisma.batchRecordSection.findUnique({
      where: { id: activeSection.id }
    })

    if (placeholderRecord) {
      return placeholderRecord
    }
  }

  if (activeSection && (activeSection.status === 'COMPLETED' || activeSection.status === 'PENDING_APPROVAL')) {

    // TODO: Re-enable when TypeScript types are fixed
    if (!bypassLocks && activeSection && activeSection.status === 'COMPLETED') {
      throw new Error(`Section '${sectionId}' is completed and locked. An approval request is required to make changes.`)
    }

    if (!bypassLocks && activeSection && activeSection.status === 'PENDING_APPROVAL') {
      throw new Error(`Section '${sectionId}' has a pending approval request. Cannot save until request is resolved.`)
    }

    //Check section dependencies before allowing save
    const dependencyCheck = await checkSectionDependencies(sectionId, batchRecordId)
    if (dependencyCheck && !(dependencyCheck.ok)) {
      throw new Error(`Section '${sectionId}' cannot be saved: ${dependencyCheck.message}`)
    }
  }

  let newSection: BatchRecordSection
  let auditAction = 'CREATE'
  let previousValue: InputJsonValue | null = null

  if (activeSection && isPlaceholderRecord(activeSection)) {
    previousValue = (activeSection.sectionData ?? null) as InputJsonValue | null

    newSection = await prisma.batchRecordSection.update({
      where: { id: activeSection.id },
      data: {
        sectionData,
        status: sectionStatus,
        ...getLockData(sectionStatus),
      }
    })

    auditAction = 'CREATE'
  } else if (activeSection) {
    previousValue = (activeSection.sectionData ?? null) as InputJsonValue | null

    await prisma.batchRecordSection.update({
      where: { id: activeSection.id },
      data: { isActive: false }
    })

    newSection = await prisma.batchRecordSection.create({
      data: {
        batchRecordId,
        sectionId,
        parentSectionId: parentSectionId || activeSection.parentSectionId,
        sectionData,
        sectionType: activeSection.sectionType,
        status: sectionStatus, // Mark as completed when saved
        version: highestVersion + 1,
        isActive: true,
        previousVersionId: activeSection.id,
        ...getLockData(sectionStatus),
      }
    })

    auditAction = 'UPDATE'

  } else {
    previousValue = null

    newSection = await prisma.batchRecordSection.create({
      data: {
        batchRecordId,
        sectionId,
        parentSectionId: parentSectionId || null,
        sectionData,
        sectionType: parentSectionId ? SectionType.SUBSECTION : SectionType.SECTION,
        status: sectionStatus,
        version: highestVersion + 1,
        isActive: true,
        previousVersionId: existingSections.length > 0 ? existingSections[0]?.id || null : null,
        ...getLockData(sectionStatus),
      }
    })

    auditAction = existingSections.length > 0 ? 'REACTIVATE' : 'CREATE'
  }

  // If section is a subsection -> check for parent complete status
  if (parentSectionId) {
    const allOtherSubsections = await prisma.batchRecordSection.findMany({
      where: { batchRecordId, parentSectionId, isActive: true },
      select: { status: true }
    })

    const allSectionsCompleted = allOtherSubsections.every(subsection =>
      [
        SectionStatus.COMPLETED,
        SectionStatus.PENDING_APPROVAL,
        SectionStatus.APPROVED,
        SectionStatus.APPROVED_FOR_CHANGE
      ].includes(subsection.status)
    )

    await prisma.batchRecordSection.update({
      where: { id: parentSectionId },
      data: {
        status: allSectionsCompleted ? SectionStatus.COMPLETED : SectionStatus.DRAFT,
        lockedAt: allSectionsCompleted ? new Date() : null,
        lockedBy: allSectionsCompleted ? userId : null,
      }
    })
  }

  await updateBatchStatus(batchRecordId)

  await createSectionAuditLog(
    batchRecordId,
    sectionId,
    userId,
    auditAction,
    previousValue,
    sectionData,
    ipAddress,
    userAgent,
    req
  )

  return newSection
}





// Get version history for a section
export async function getBatchRecordSectionHistory(
  batchRecordId: string,
  sectionId: string
): Promise<BatchRecordSection[]> {
  return prisma.batchRecordSection.findMany({
    where: {
      batchRecordId,
      sectionId
    },
    orderBy: { version: 'desc' },
    include: {
      creator: {
        select: { firstName: true, lastName: true, email: true }
      },
      updator: {
        select: { firstName: true, lastName: true, email: true }
      }
    }
  })
}

// Get approval requests for a section
export async function getApprovalRequestsForSection(
  batchRecordId: string,
  sectionId: string
) {
  return prisma.approvalRequest.findMany({
    where: {
      batchRecordId,
      sectionId
    },
    orderBy: { requestedAt: 'desc' },
    include: {
      requester: {
        select: { firstName: true, lastName: true, email: true }
      },
      reviewer: {
        select: { firstName: true, lastName: true, email: true }
      }
    }
  })
}

export async function returnSectionUUID(sectionId: string, batchRecordId: string): Promise<string | null> {
  const sectionData = await prisma.batchRecordSection.findFirst({
    where: {
      batchRecordId,
      sectionId,
      isActive: true
    },
    select: {
      id: true
    }
  })

  return sectionData?.id ?? null
}

export async function createApprovalRequest(
  batchRecordId: string,
  sectionId: string,
  requestType: string,
  reason: string,
  description: string | null,
  requestedBy: string,
  existingData?: InputJsonValue,
  proposedData?: InputJsonValue,
  parentSectionId?: string | null,
  ipAddress?: string,
  userAgent?: string,
  req?: Request
) {
  let storedUserId = requestedBy
  let userExistsForAudit = false
  if (req) {
    const result = await ensureUserForAudit(requestedBy, req as any)
    storedUserId = result.userId || requestedBy
    userExistsForAudit = result.userExists
  } else {
    try {
      const user = await prisma.user.findUnique({ where: { id: requestedBy }, select: { id: true } })
      userExistsForAudit = !!user
    } catch (error) {
      console.warn(`Failed to verify user ${requestedBy} exists:`, error)
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const activeSection = await tx.batchRecordSection.findFirst({
      where: {
        batchRecordId,
        sectionId,
        isActive: true
      },
      select: {
        id: true,
        status: true,
        lockedAt: true,
        lockedBy: true
      }
    })

    if (!activeSection) {
      throw new Error(`Active section '${sectionId}' not found for batch ${batchRecordId}`)
    }

    if (activeSection.status === 'PENDING_APPROVAL') {
      throw new Error(`Section '${sectionId}' already has a pending approval request`)
    }

    const request = await tx.approvalRequest.create({
      data: {
        batchRecordId,
        sectionId,
        requestType,
        reason,
        description,
        ...(existingData !== undefined && { existingData }),
        ...(proposedData !== undefined && { proposedData }),
        requestedBy,
        parentSectionId: parentSectionId || null,
      },
      include: {
        requester: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    })

    // Audit log for approval request creation (within transaction)
    // Include actual data changes (existingData vs proposedData) so users can see what was edited
    const auditData: any = {
      action: 'APPROVAL_REQUEST_CREATED',
      entityType: 'ApprovalRequest',
      entityId: request.id,
      oldValue: {
        status: activeSection.status,
        ...(existingData !== undefined && { existingData })
      },
      newValue: {
        requestId: request.id,
        requestType,
        reason,
        sectionId,
        status: 'PENDING_APPROVAL',
        ...(proposedData !== undefined && { proposedData })
      },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    }

    if (storedUserId && userExistsForAudit) {
      auditData.user = { connect: { id: storedUserId } }
    } else {
      auditData.userId = storedUserId || null
    }

    if (batchRecordId) {
      auditData.batch = { connect: { id: batchRecordId } }
    }

    await tx.auditLog.create({
      data: auditData
    })

    await tx.batchRecordSection.update({
      where: { id: activeSection.id },
      data: {
        status: 'PENDING_APPROVAL',
        approvalRequestId: request.id,
        lockedAt: activeSection.lockedAt ?? new Date(),
        lockedBy: activeSection.lockedBy ?? requestedBy
      }
    })

    return request
  })

  // Audit log already created inside transaction above - no need to create duplicate
  // The audit log includes both ApprovalRequest details and section status change

  return result
}

export async function getApprovalRequests(batchRecordId: string) {
  return prisma.approvalRequest.findMany({
    where: { batchRecordId },
    orderBy: { requestedAt: 'desc' },
    include: {
      requester: {
        select: { firstName: true, lastName: true, email: true }
      },
      reviewer: {
        select: { firstName: true, lastName: true, email: true }
      }
    }
  })
}

// Get all approval requests (for admin/QA view)
export async function getAllApprovalRequests() {
  return prisma.approvalRequest.findMany({
    orderBy: { requestedAt: 'desc' },
    include: {
      requester: {
        select: { firstName: true, lastName: true, email: true }
      },
      reviewer: {
        select: { firstName: true, lastName: true, email: true }
      },
      batchRecord: {
        select: {
          batchNumber: true,
          product: {
            select: {
              productName: true,
              productCode: true
            }
          }
        }
      }
    }
  })
}

// Get a single approval request by ID
export async function getApprovalRequestById(requestId: string) {
  return prisma.approvalRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: {
        select: { firstName: true, lastName: true, email: true }
      },
      reviewer: {
        select: { firstName: true, lastName: true, email: true }
      },
      batchRecord: {
        select: {
          batchNumber: true,
          product: {
            select: {
              productName: true,
              productCode: true
            }
          }
        }
      }
    }
  })
}

// Approve a section for changes (unlocks it)
export async function approveSectionForChanges(
  batchRecordId: string,
  sectionId: string,
  approvalRequestId: string,
  reviewedBy: string,
  reviewComments?: string
) {
  // First, get the approval request to check its type
  const approvalRequest = await prisma.approvalRequest.findUnique({
    where: { id: approvalRequestId },
    select: {
      requestType: true,
      proposedData: true,
      parentSectionId: true
    }
  })

  if (!approvalRequest) {
    throw new Error(`Approval request ${approvalRequestId} not found`)
  }

  // Update the approval request status
  await prisma.approvalRequest.update({
    where: { id: approvalRequestId },
    data: {
      status: 'APPROVED',
      reviewedBy,
      reviewedAt: new Date(),
      reviewComments: reviewComments ?? null
    }
  })

  // Handle different approval types
  const activeSection = await prisma.batchRecordSection.findFirst({
    where: {
      batchRecordId,
      sectionId,
      isActive: true
    },
    select: {
      id: true,
      sectionType: true,
      parentSectionId: true,
      sectionData: true
    }
  })

  if (!activeSection) {
    throw new Error(`Active section '${sectionId}' not found for batch ${batchRecordId}`)
  }

  const shouldCreateNewVersion = approvalRequest.requestType !== 'SECTION_APPROVAL'

  if (shouldCreateNewVersion) {
    const proposedData =
      approvalRequest.proposedData ?? (activeSection.sectionData as any) ?? null

    if (!proposedData) {
      throw new Error('Approval request must include proposed data to approve')
    }

    const newSection = await createImmutableBatchRecordSection(
      batchRecordId,
      sectionId,
      proposedData,
      reviewedBy,
      activeSection.parentSectionId || approvalRequest.parentSectionId || undefined,
      undefined,
      undefined,
      SectionStatus.COMPLETED,
      true,
      undefined
    )

    await prisma.batchRecordSection.update({
      where: { id: newSection.id },
      data: {
        approvalRequestId: null,
        status: SectionStatus.APPROVED,
        lockedAt: new Date(),
        lockedBy: reviewedBy,
        completedAt: new Date(),
        completedBy: reviewedBy
      }
    })

    if (activeSection.parentSectionId) {
      const allSubsections = await prisma.batchRecordSection.findMany({
        where: {
          batchRecordId,
          parentSectionId: activeSection.parentSectionId,
          isActive: true
        },
        select: { status: true }
      })

      const allSectionsCompleted = allSubsections.every(subsection =>
        [
          SectionStatus.COMPLETED,
          SectionStatus.APPROVED,
          SectionStatus.APPROVED_FOR_CHANGE
        ].includes(subsection.status)
      )

      if (allSectionsCompleted) {
        await prisma.batchRecordSection.update({
          where: { id: activeSection.parentSectionId },
          data: {
            status: SectionStatus.COMPLETED,
            lockedAt: new Date(),
            lockedBy: reviewedBy
          }
        })
      }
    }

    return { success: true, message: 'Approval request approved and new section version created' }
  }

  await prisma.batchRecordSection.update({
    where: { id: activeSection.id },
    data: {
      status: SectionStatus.APPROVED,
      approvalRequestId: null,
      completedBy: reviewedBy,
      completedAt: new Date(),
      lockedAt: new Date(),
      lockedBy: reviewedBy
    }
  })

  if (activeSection.parentSectionId) {
    const allOtherSubsections = await prisma.batchRecordSection.findMany({
      where: {
        batchRecordId,
        parentSectionId: activeSection.parentSectionId,
        isActive: true
      },
      select: { status: true }
    })

    const allSectionsCompleted = allOtherSubsections.every(subsection =>
      [
        SectionStatus.COMPLETED,
        SectionStatus.PENDING_APPROVAL,
        SectionStatus.APPROVED,
        SectionStatus.APPROVED_FOR_CHANGE
      ].includes(subsection.status)
    )

    if (allSectionsCompleted) {
      await prisma.batchRecordSection.update({
        where: { id: activeSection.parentSectionId },
        data: {
          status: SectionStatus.COMPLETED,
          lockedAt: new Date(),
          lockedBy: reviewedBy
        }
      })
    }
  }

  return { success: true, message: 'Section approval completed' }
}

// Reject an approval request (restores section to previous state)
export async function rejectApprovalRequest(
  batchRecordId: string,
  sectionId: string,
  approvalRequestId: string,
  reviewedBy: string,
  reviewComments?: string
) {
  // First, get the approval request to check its details
  const approvalRequest = await prisma.approvalRequest.findUnique({
    where: { id: approvalRequestId },
    select: {
      requestType: true,
      status: true
    }
  })

  if (!approvalRequest) {
    throw new Error(`Approval request ${approvalRequestId} not found`)
  }

  if (approvalRequest.status !== 'PENDING') {
    throw new Error(`Approval request ${approvalRequestId} is not pending and cannot be rejected`)
  }

  // Update the approval request status to REJECTED
  await prisma.approvalRequest.update({
    where: { id: approvalRequestId },
    data: {
      status: 'REJECTED',
      reviewedBy,
      reviewedAt: new Date(),
      reviewComments: reviewComments ?? null
    }
  })

  // Get the active section to restore its status
  const activeSection = await prisma.batchRecordSection.findFirst({
    where: {
      batchRecordId,
      sectionId,
      isActive: true
    },
    select: {
      id: true,
      status: true,
      parentSectionId: true
    }
  })

  if (activeSection) {
    // Restore section status - if it was completed before, set back to COMPLETED, otherwise DRAFT
    // Clear the approvalRequestId and PENDING_APPROVAL status
    const previousStatus = activeSection.status === 'PENDING_APPROVAL'
      ? 'COMPLETED' // Assume it was completed before approval request
      : activeSection.status === 'COMPLETED'
        ? 'COMPLETED'
        : 'DRAFT'

    await prisma.batchRecordSection.update({
      where: { id: activeSection.id },
      data: {
        status: previousStatus,
        approvalRequestId: null // Clear the approval request reference
        // Note: We don't change lockedAt/lockedBy if it was already completed
        // The section data remains unchanged (old data is kept)
      }
    })

    // If this is a subsection, we might need to update parent status
    if (activeSection.parentSectionId) {
      const allOtherSubsections = await prisma.batchRecordSection.findMany({
        where: {
          batchRecordId,
          parentSectionId: activeSection.parentSectionId,
          isActive: true
        },
        select: { status: true }
      })

      // Check if all subsections are completed (excluding the one we just updated)
      const allSectionsCompleted = allOtherSubsections.every(subsection =>
        subsection.status === SectionStatus.COMPLETED || subsection.status === SectionStatus.PENDING_APPROVAL
      )

      if (allSectionsCompleted && previousStatus === 'COMPLETED') {
        await prisma.batchRecordSection.update({
          where: { id: activeSection.parentSectionId },
          data: {
            status: SectionStatus.COMPLETED,
            lockedAt: new Date(),
            lockedBy: reviewedBy
          }
        })
      }
    }
  }

  return { success: true, message: 'Approval request rejected. Section data unchanged.' }
}
