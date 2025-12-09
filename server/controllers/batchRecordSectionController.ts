import { SectionStatus, type BatchRecordSection, PrismaClient } from "@prisma/client";
import { getBatchRecordSectionWithAllChildren, createImmutableBatchRecordSection, getBatchRecordSectionsById, getBatchRecordSectionHistory, returnSectionUUID, getApprovalRequestsForSection } from "../services/batchRecordSectionServices.js";
import { fetchBatchRecordById } from "../services/batchRecordServices.js";
import type { Request, Response } from "express";
import { getClientIp } from "../utils/getClientIp.js";

const prisma = new PrismaClient()

export async function fetchBRSection(req: Request, res: Response) {
  const { batchRecordId, sectionId } = req.params

  if (!batchRecordId || !sectionId) {
    return res.status(400).json({ error: `Cannot fetch Batch Record Data: Invalid request params` })
  }
  try {
    const sectionData = await getBatchRecordSectionWithAllChildren(batchRecordId, sectionId)
    if (!sectionData) {
      return res.status(404).json({ error: 'Section not found' })
    }

    // Transform database structure to frontend format
    const transformToFrontendFormat = (section: any): any => {
      const result = { ...section.sectionData }

      // Add child sections as properties
      if (section.childSections && section.childSections.length > 0) {
        section.childSections.forEach((child: any) => {
          result[child.sectionId] = transformToFrontendFormat(child)
        })
      }

      return result
    }

    const transformedData = transformToFrontendFormat(sectionData)

    // Include section metadata for frontend
    const responseData = {
      sectionData: transformedData,
      metadata: {
        status: sectionData.status,
        version: sectionData.version,
        lockedAt: sectionData.lockedAt,
        lockedBy: sectionData.lockedBy,
        isActive: sectionData.isActive
      }
    }

    return res.status(200).json(responseData)
  } catch (error) {
    console.error(`Get section error`, error)
    res.status(500).json({ error: `Failed to save section` })
  }
}

function transformSectionsToJSON(sections: BatchRecordSection[]): Record<string, any> {

  //Transform sections array into a map
  const nodesById = new Map<string, any>()
  for (const section of sections) {
    nodesById.set(section.id, { ...section, childSections: [] as any[] })
  }

  for (const node of nodesById.values()) {
    if (node.parentSectionId) {
      const parent = nodesById.get(node.parentSectionId)
      if (parent) parent.childSections.push(node)
    }
  }

  const transformMapToJSON = (node: any): any => {
    const result = { ...(node.sectionData as any) }
    if (node.childSections && node.childSections.length) {
      for (const child of node.childSections) {
        result[child.sectionId] = transformMapToJSON(child)
      }
    }
    return result
  }

  const output: Record<string, any> = {}
  for (const node of nodesById.values()) {
    if (!node.path) {
      output[node.sectionId] = transformMapToJSON(node)
    }
  }
  return output

}

export async function fetchBatchRecordSectionsByID(req: Request, res: Response) {

  const { batchRecordId } = req.params

  if (!batchRecordId) { return res.status(400).json({ error: `Missing required fields: batchRecordId` }) }

  try {
    const result = await getBatchRecordSectionsById(batchRecordId)

    if (!result) {
      return res.status(404).json({ error: 'No Batch Record ections found' })
    }

    const sectionsJSON = transformSectionsToJSON(result)

    // Include metadata for each section
    const sectionsMetadata = result.reduce((acc: any, section: any) => {
      acc[section.sectionId] = {
        status: section.status,
        version: section.version,
        lockedAt: section.lockedAt,
        lockedBy: section.lockedBy,
        isActive: section.isActive
      }
      return acc
    }, {})

    const responseData = {
      sections: sectionsJSON,
      metadata: sectionsMetadata
    }

    res.status(200).json(responseData)

  } catch (error) {
    console.error(`Save section error: `, error)
    res.status(500).json({ error: 'Failed to save section' })
  }

}

function validateStartingMaterials(sectionData: any, plannedQuantity: number): boolean {
  const rows = Array.isArray(sectionData?.material?.rows)
    ? sectionData.material.rows
    : Array.isArray(sectionData?.material)
      ? sectionData.material
      : [];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Starting Material table is empty or invalid.');
  }

  const sumNumbers = (collection: any[], key: string) =>
    collection.reduce((total: number, item: any) => {
      const value = Number(item?.[key]);
      return Number.isFinite(value) ? total + value : total;
    }, 0);

  const totalActual = sumNumbers(rows, 'actualWt') || sumNumbers(rows, 'actualWeight');
  const totalComposition = sumNumbers(rows, 'composition');

  const withinTolerance = (left: number, right: number, epsilon = 0.001) =>
    Math.abs(left - right) <= epsilon;

  if (!withinTolerance(totalActual, plannedQuantity)) {
    throw new Error(`Actual weight total (${totalActual}) must match planned quantity (${plannedQuantity}).`);
  }

  if (!withinTolerance(totalComposition, 100)) {
    throw new Error(`Composition percentages must total 100 (received ${totalComposition}).`);
  }

  return true;
}

export async function addBRSection(req: Request, res: Response) {
  const { batchRecordId } = req.params
  const { sectionId, sectionData, parentSectionId, userId } = req.body

  if (!batchRecordId || !sectionId || !sectionData || !userId) {
    return res.status(400).json({ error: `Missing required fields: batchRecordId, sectionId, sectionData, userId` })
  }

  try {
    if (sectionData.material || sectionData.StartingMaterials) {
      const batchRecord = await fetchBatchRecordById(batchRecordId);
      if (!batchRecord) {
        throw new Error('Batch record not found for starting materials validation.');
      }
      validateStartingMaterials(sectionData, batchRecord.plannedQuantity);
    }
  } catch (error: any) {
    console.error('Starting Materials Validation error:', error)
    return res.status(400).json({ error: `Validation error: ${error.message}` })
  }

  try {
    // Resolve parent section UUID if parentSectionId is provided
    let parentSectionUUID: string | null = null
    if (parentSectionId) {
      parentSectionUUID = await returnSectionUUID(parentSectionId, batchRecordId)

      // If parent section doesn't exist, create a placeholder parent section
      if (!parentSectionUUID) {
        console.log(`Parent section '${parentSectionId}' not found, creating placeholder...`)

        const placeholderParent = await createImmutableBatchRecordSection(
          batchRecordId,
          parentSectionId,
          {},
          userId,
          undefined,
          undefined,
          undefined,
          SectionStatus.DRAFT,
          false,
          req
        )

        parentSectionUUID = placeholderParent.id
      }
    }

    const ipAddress = getClientIp(req);
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    const result = await createImmutableBatchRecordSection(
      batchRecordId,
      sectionId,
      sectionData,
      userId,
      parentSectionUUID || undefined,
      ipAddress,
      userAgent,
      SectionStatus.COMPLETED,
      false,
      req
    )
    res.status(201).json(result)
  } catch (error) {
    console.error(`Save section error: `, error)
    res.status(500).json({ error: 'Failed to save section' })
  }
}

export async function fetchBRSectionHistory(req: Request, res: Response) {
  const { batchRecordId, sectionId } = req.params

  if (!batchRecordId || !sectionId) {
    return res.status(400).json({ error: 'Missing required fields: batchRecordId, sectionId' })
  }

  try {
    const history = await getBatchRecordSectionHistory(batchRecordId, sectionId)

    if (!history || history.length === 0) {
      return res.status(200).json([])
    }

    // Fetch approval requests for the main section
    const approvalRequestsMap = new Map<string, any[]>()
    approvalRequestsMap.set(
      sectionId,
      await getApprovalRequestsForSection(batchRecordId, sectionId)
    )

    const versionIds = history.map((version: any) => version.id)

    const subsectionRecords = await prisma.batchRecordSection.findMany({
      where: {
        batchRecordId,
        parentSectionId: { in: versionIds }
      },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        sectionId: true,
        parentSectionId: true,
        version: true,
        sectionData: true
      }
    })

    const childSectionIds = Array.from(
      new Set(
        subsectionRecords
          .map((record) => record.sectionId)
          .filter((value): value is string => Boolean(value))
      )
    )

    if (childSectionIds.length > 0) {
      const childRequests = await Promise.all(
        childSectionIds.map(async (childSectionId) => {
          const requests = await getApprovalRequestsForSection(batchRecordId, childSectionId)
          return [childSectionId, requests] as const
        })
      )

      childRequests.forEach(([childSectionId, requests]) => {
        approvalRequestsMap.set(childSectionId, requests)
      })
    }

    type SubsectionRecord = typeof subsectionRecords[number]

    const subsectionRecordsByParent = subsectionRecords.reduce((acc, record) => {
      if (!record.parentSectionId) {
        return acc
      }
      if (!acc.has(record.parentSectionId)) {
        acc.set(record.parentSectionId, [])
      }
      acc.get(record.parentSectionId)!.push(record)
      return acc
    }, new Map<string, SubsectionRecord[]>())

    // Transform the data to include user-friendly information and approval requests
    const transformedHistory = await Promise.all(history.map(async (version: any) => {
      const subsectionCandidates = subsectionRecordsByParent.get(version.id) ?? []
      const latestSubsectionsBySection = new Map<string, typeof subsectionCandidates[0]>()

      subsectionCandidates.forEach((candidate) => {
        if (!latestSubsectionsBySection.has(candidate.sectionId)) {
          latestSubsectionsBySection.set(candidate.sectionId, candidate)
        }
      })

      const combinedSectionData = {
        ...(version.sectionData || {})
      }

      for (const subsectionRecord of latestSubsectionsBySection.values()) {
        combinedSectionData[subsectionRecord.sectionId] = subsectionRecord.sectionData
      }

      const relevantSectionIds = new Set<string>([
        sectionId,
        ...latestSubsectionsBySection.keys()
      ])

      const aggregatedRequests: any[] = []

      relevantSectionIds.forEach((id) => {
        const requests = approvalRequestsMap.get(id)
        if (requests && requests.length > 0) {
          aggregatedRequests.push(...requests)
        }
      })

      const uniqueRequests = Array.from(
        aggregatedRequests.reduce((acc, request) => {
          if (!acc.has(request.id)) {
            acc.set(request.id, request)
          }
          return acc
        }, new Map<string, any>())
        .values()
      ).filter((request: any) => request.sectionId === version.sectionId)

      const directlyLinkedRequests = uniqueRequests.filter((ar: any) =>
        ar.id === version.approvalRequestId
      )

      const priorRequests = uniqueRequests.filter((ar: any) => {
        if (directlyLinkedRequests.some((linked) => linked.id === ar.id)) {
          return false
        }

        if (version.completedAt && ar.requestedAt) {
          const versionDate = new Date(version.completedAt)
          const requestDate = new Date(ar.requestedAt)
          return requestDate <= versionDate
        }

        return true
      })

      const allRelatedRequests = [...directlyLinkedRequests, ...priorRequests].sort(
        (a: any, b: any) =>
          new Date(b.requestedAt ?? 0).getTime() - new Date(a.requestedAt ?? 0).getTime()
      )

      return {
        id: version.id,
        version: version.version,
        isActive: version.isActive,
        sectionData: combinedSectionData,
        completedAt: version.completedAt,
        updatedAt: version.updatedAt,
        completedBy: version.creator ? {
          name: `${version.creator.firstName} ${version.creator.lastName}`,
          email: version.creator.email
        } : null,
        updatedBy: version.updator ? {
          name: `${version.updator.firstName} ${version.updator.lastName}`,
          email: version.updator.email
        } : null,
        approvalRequestId: version.approvalRequestId,
        approvalRequests: allRelatedRequests.map((ar: any) => ({
          id: ar.id,
          requestType: ar.requestType,
          status: ar.status,
          sectionId: ar.sectionId,
          requestedAt: ar.requestedAt,
          reviewedAt: ar.reviewedAt,
          reviewComments: ar.reviewComments,
          existingData: ar.existingData,
          proposedData: ar.proposedData,
          requester: ar.requester ? {
            name: `${ar.requester.firstName} ${ar.requester.lastName}`,
            email: ar.requester.email
          } : null,
          reviewer: ar.reviewer ? {
            name: `${ar.reviewer.firstName} ${ar.reviewer.lastName}`,
            email: ar.reviewer.email
          } : null
        }))
      }
    }))

    res.status(200).json(transformedHistory)
  } catch (error) {
    console.error('Fetch section history error:', error)
    res.status(500).json({ error: 'Failed to fetch section history' })
  }
}
