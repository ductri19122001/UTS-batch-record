import { upsertUserFromAuth0 } from "../services/userServices.js";
import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "jsonwebtoken";
import { UserRole } from "@prisma/client";

interface AuthenticatedRequest extends Request {
  auth?: JwtPayload & {
    sub: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    [claim: string]: unknown;
  };
}

export default async function syncUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // console.log(`Syncing user from Auth0 token claims...${JSON.stringify(req.auth)}`);
    const claims = req.auth;
    if (!claims?.sub) {
      return next(new Error("Authenticated request is missing Auth0 subject"));
    }

    const namespace = "https://nepbio.auth.com/user-details/";

    const emailClaim = claims[`${namespace}email`];
    const fullName = claims[`${namespace}name`];
    const rolesClaim = claims[`${namespace}roles`];

    console.log(
      `Synchronizing user with Auth0 ID: ${claims.sub}, email: ${emailClaim}, name: ${fullName}, roles: ${rolesClaim}`
    );

    const email = typeof emailClaim === "string" ? emailClaim : undefined;
    if (!email) {
      return next(new Error("Auth0 token is missing required email claim"));
    }

    let firstName = "Unknown";
    let lastName = "User";
    if (fullName && typeof fullName === "string") {
      firstName = fullName.split(" ")[0] ?? "Unknown";
      lastName = fullName.split(" ")[1] ?? "User"
    }

    let role: UserRole = UserRole.VIEWER;

    if (Array.isArray(rolesClaim) && rolesClaim.length > 0) {
      const candidate = String(rolesClaim[0]).toUpperCase();
      if (candidate in UserRole) {
        role = UserRole[candidate as keyof typeof UserRole];
      }
    } else if (typeof rolesClaim === "string") {
      const candidate = rolesClaim.toUpperCase();
      if (candidate in UserRole) {
        role = UserRole[candidate as keyof typeof UserRole];
      }
    }

    await upsertUserFromAuth0({
      id: claims.sub,
      email,
      firstName,
      lastName,
      role,
    });
    console.log(`Synchronized user ${email} with role ${role}`);
    return next();
  } catch (error) {
    return next(error);
  }
}
