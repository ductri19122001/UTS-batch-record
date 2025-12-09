import type { Request, Response, NextFunction } from 'express'
import { verifyElectronicSignature } from '../services/signatureServices.js'

export default function requireSignature(options: {
  makeCanonicalPayload: (req: Request) => Record<string, unknown>
  getExpectedUserId: (req: Request) => string
  maxAgeSeconds?: number
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signatureId = (req.body && req.body.signatureId) || (req.query && (req.query.signatureId as string))
      if (!signatureId) {
        console.error('Missing signatureId in request')
        return res.status(400).json({ success: false, message: 'signatureId is required' })
      }
      const expectedUserId = options.getExpectedUserId(req)
      const canonicalPayload = options.makeCanonicalPayload(req)
      const result = await verifyElectronicSignature({
        signatureId,
        expectedUserId,
        expectedCanonicalPayload: canonicalPayload,
        ...(options.maxAgeSeconds !== undefined && { maxAgeSeconds: options.maxAgeSeconds })
      })
      if (!result.ok) {
        return res.status(401).json({ success: false, message: `Invalid signature: ${result.reason}` })
      }
      return next()
    } catch (err) {
      return next(err)
    }
  }
}


