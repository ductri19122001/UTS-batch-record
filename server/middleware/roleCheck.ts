import type { Request, Response, NextFunction } from "express"
import { ResponseError } from "./errorHandler.js"

interface AuthenticatedRequest extends Request {
  auth?: {
    sub: string;
    [key: string]: any;
  };
}

export const requireRole = (requiredRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.log(req.auth);
    try {
      const userRoles = req.auth?.['https://nepbio.auth.com/roles']

      if (!userRoles || userRoles.length == 0) {
        console.log("Can't retrieve user roles")
      }

      if (!Array.isArray(userRoles)) {
        throw new ResponseError('Invalid user roles format', 403)
      }

      let hasRequiredRole = false

      for (const role of userRoles) {
        if (requiredRoles.includes(role)) {
          hasRequiredRole = true
          break
        }
      }

      if (!hasRequiredRole) {
        throw new ResponseError(`Access Denied: Required Roles ${requiredRoles.join(', ')}`, 403)
      }

      next()

    } catch (error) {
      next(error)
    }
  }

}
