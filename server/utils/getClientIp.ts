import type { Request } from 'express'

/**
 * Extract the real client IP address from the request
 * Handles proxy headers like X-Forwarded-For, X-Real-IP, etc.
 */
export function getClientIp(req: Request): string {
  // Check X-Forwarded-For header (most common for proxies/load balancers)
  const forwardedFor = req.headers['x-forwarded-for']
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
    // We want the first one (original client)
    const ips = typeof forwardedFor === 'string' 
      ? forwardedFor.split(',').map(ip => ip.trim())
      : forwardedFor
    if (ips.length > 0 && ips[0]) {
      return ips[0]
    }
  }

  // Check X-Real-IP header (used by some proxies)
  const realIp = req.headers['x-real-ip']
  if (realIp && typeof realIp === 'string') {
    return realIp
  }

  // Fall back to req.ip (requires trust proxy to be set)
  if (req.ip) {
    return req.ip
  }

  // Last resort: use connection remote address
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress
  }

  return 'unknown'
}

