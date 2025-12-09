import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

export type CanonicalPayload = Record<string, unknown>

export function canonicalizeJson(input: CanonicalPayload): string {
  function sortKeys(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(sortKeys)
    }
    if (obj && typeof obj === 'object') {
      const sorted: Record<string, any> = {}
      Object.keys(obj).sort().forEach(k => {
        sorted[k] = sortKeys((obj as any)[k])
      })
      return sorted
    }
    return obj
  }
  const sorted = sortKeys(input)
  return JSON.stringify(sorted)
}

export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

export async function createElectronicSignature(params: {
  userId: string
  entityType: string
  entityId: string
  canonicalPayload: CanonicalPayload
  batchRecordId?: string
  sectionRecordId?: string
  ipAddress?: string
  userAgent?: string
}) {
  const payloadHash = sha256(canonicalizeJson(params.canonicalPayload))

  const sig = await prisma.electronicSignature.create({
    data: {
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      payloadHash,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      batchRecordId: params.batchRecordId ?? null,
      sectionRecordId: params.sectionRecordId ?? null
    }
  })

  return sig
}

export async function verifyElectronicSignature(params: {
  signatureId: string
  expectedUserId: string
  expectedCanonicalPayload: CanonicalPayload
  maxAgeSeconds?: number
}) {
  const sig = await prisma.electronicSignature.findUnique({ where: { id: params.signatureId } })
  if (!sig) return { ok: false, reason: 'NOT_FOUND' as const }
  if (sig.userId !== params.expectedUserId) return { ok: false, reason: 'USER_MISMATCH' as const }

  const expectedHash = sha256(canonicalizeJson(params.expectedCanonicalPayload))
  if (sig.payloadHash !== expectedHash) return { ok: false, reason: 'HASH_MISMATCH' as const }

  if (params.maxAgeSeconds) {
    const ageMs = Date.now() - sig.createdAt.getTime()
    if (ageMs > params.maxAgeSeconds * 1000) return { ok: false, reason: 'EXPIRED' as const }
  }
  return { ok: true as const }
}


