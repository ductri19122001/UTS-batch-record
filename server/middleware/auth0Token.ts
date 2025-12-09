import axios from "axios"
import type { Request, Response, NextFunction } from "express"

declare module "express-serve-static-core" {
  interface Request {
    auth0ManagementToken?: string
  }
}

type CachedToken = {
  accessToken: string
  expiresAt: number
} | null

let cachedToken: CachedToken = null

export async function getAuth0ManagementToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const now = Date.now()

    if (!cachedToken || now >= cachedToken.expiresAt) {
      const domain = process.env.AUTH0_MGMT_DOMAIN || process.env.AUTH0_DOMAIN
      const clientId = process.env.AUTH0_MGMT_CLIENT_ID
      const clientSecret = process.env.AUTH0_MGMT_CLIENT_SECRET
      const audience = process.env.AUTH0_MGMT_AUDIENCE

      if (!domain || !clientId || !clientSecret || !audience) {
        return next(
          new Error("Auth0 Management API environment variables are not configured")
        )
      }

      const normalizedDomain = domain.replace(/\/$/, "")

      const response = await axios.post(
        `${normalizedDomain}/oauth/token`,
        {
          client_id: clientId,
          client_secret: clientSecret,
          audience,
          grant_type: "client_credentials",
        },
        {
          headers: { "content-type": "application/json" },
        }
      )

      const { access_token: accessToken, expires_in: expiresIn } = response.data
      if (!accessToken) {
        return next(new Error("Auth0 token response is missing an access token"))
      }

      const ttl = typeof expiresIn === "number" ? expiresIn : 3600
      cachedToken = {
        accessToken,
        expiresAt: now + ttl * 1000 - 60_000, // Refresh one minute before expiry
      }
    }

    req.auth0ManagementToken = cachedToken.accessToken
    return next()
  } catch (error) {
    return next(error)
  }
}
