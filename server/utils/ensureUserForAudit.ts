import { PrismaClient } from '@prisma/client'
import type { Request } from 'express'
import { upsertUserFromAuth0 } from '../services/userServices.js'
import { UserRole } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

interface AuthenticatedRequest extends Request {
  auth?: {
    sub: string
    [key: string]: any
  }
}

/**
 * Decodes JWT token from Authorization header
 * Returns decoded payload or null if decoding fails
 */
function decodeJWTFromHeader(req?: Request): any {
  if (!req) return null
  
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Decode without verification (since we're just extracting user info for syncing)
    // In production, you might want to verify the token signature
    const decoded = jwt.decode(token, { complete: false }) as any
    return decoded || null
  } catch (error) {
    console.warn('Failed to decode JWT token from header:', error)
    return null
  }
}

/**
 * Ensures a user exists in the database for audit logging
 * If the user doesn't exist and we have JWT token info, attempts to sync them
 * Always returns the userId for storage in audit logs
 */
export async function ensureUserForAudit(
  userId: string | undefined | null,
  req?: AuthenticatedRequest
): Promise<{ userId: string | null; userExists: boolean }> {
  if (!userId) {
    return { userId: null, userExists: false }
  }

  // First check if user already exists
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (existingUser) {
      return { userId, userExists: true }
    }

    // User doesn't exist - try to sync from JWT token if available
    // First try req.auth (if authCheck middleware is enabled)
    let claims = req?.auth
    
    // If req.auth is not available, try to decode from Authorization header
    if (!claims && req) {
      const decoded = decodeJWTFromHeader(req)
      if (decoded && decoded.sub === userId) {
        claims = decoded
      }
    }
    
    if (claims && claims.sub === userId) {
      try {
        const namespace = 'https://nepbio.auth.com/user-details/'
        
        const emailClaim = claims[`${namespace}email`]
        const givenNameClaim = claims[`${namespace}given_name`]
        const familyNameClaim = claims[`${namespace}family_name`]
        const rolesClaim = claims[`${namespace}roles`]

        const email = typeof emailClaim === 'string' ? emailClaim : undefined
        
        if (email) {
          const firstName =
            typeof givenNameClaim === 'string' && givenNameClaim.trim().length > 0
              ? givenNameClaim
              : 'Unknown'
          const lastName =
            typeof familyNameClaim === 'string' && familyNameClaim.trim().length > 0
              ? familyNameClaim
              : 'User'

          let role: UserRole = UserRole.VIEWER
          if (Array.isArray(rolesClaim) && rolesClaim.length > 0) {
            const candidate = String(rolesClaim[0]).toUpperCase()
            if (candidate in UserRole) {
              role = UserRole[candidate as keyof typeof UserRole]
            }
          } else if (typeof rolesClaim === 'string') {
            const candidate = rolesClaim.toUpperCase()
            if (candidate in UserRole) {
              role = UserRole[candidate as keyof typeof UserRole]
            }
          }

          // Sync the user
          await upsertUserFromAuth0({
            id: userId,
            email,
            firstName,
            lastName,
            role
          })

          return { userId, userExists: true }
        }
      } catch (error) {
        console.warn(`Failed to sync user ${userId} from JWT token:`, error)
      }
    }

    // User doesn't exist and couldn't be synced - still return userId for storage
    return { userId, userExists: false }
  } catch (error) {
    console.warn(`Error checking/syncing user ${userId}:`, error)
    // Still return userId so it can be stored in audit log
    return { userId, userExists: false }
  }
}

