import { fetchUsersFromDB, addUserToDB, deleteUserFromDB, upsertUserFromAuth0, deactivateUserDB, activateUserDB } from "../services/userServices.js";
import type { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import type { User } from "@prisma/client";

dotenv.config()
const auth0MgmtDomain = process.env.AUTH0_MGMT_DOMAIN
const auth0ApiUrl = `${auth0MgmtDomain}/api/v2/users`
const prisma = new PrismaClient()

const getAuth0RoleId = (role?: string | null): string | null => {
  if (!role) {
    return null
  }

  const normalizedRole = role.toString().toUpperCase()
  const envKey = `AUTH0_ROLE_${normalizedRole}_ID`
  const roleId = process.env[envKey]

  return roleId ?? null
}

export const createUser = async (req: Request, resp: Response) => {
  const token = req.auth0ManagementToken
  const requestedRole = typeof req.body.role === 'string' ? req.body.role.toUpperCase() : ''

  if (!req.body.email || !req.body.firstName || !req.body.lastName || !req.body.password) {
    console.error('Missing required fields to create user.')
    return resp.status(400).json({ error: 'Missing required fields: email, firstName, lastName, password.' })
  }

  if (!requestedRole) {
    console.error('Role is required when creating a user.')
    return resp.status(400).json({ error: 'Role is required when creating a user.' })
  }

  const auth0RoleId = getAuth0RoleId(requestedRole)

  if (!auth0RoleId) {
    console.error(`Missing Auth0 role mapping for role '${requestedRole}'.`)
    return resp.status(400).json({
      error: `Missing Auth0 role mapping for role '${requestedRole}'. Please set environment variable AUTH0_ROLE_${requestedRole}_ID.`,
    })
  }

  if (!token) {
    return resp.status(500).json({ error: 'Auth0 Management API token is missing' })
  }

  try {
    const auth0Response = await axios.post(
      `${auth0ApiUrl}`,
      {
        email: req.body.email,
        name: `${req.body.firstName} ${req.body.lastName}`,
        family_name: req.body.lastName,
        connection: "Username-Password-Authentication",
        password: req.body.password,
        app_metadata: { role: requestedRole }
      },
      { headers: { Authorization: `Bearer ${token}` }, }
    )

    const userId = auth0Response.data.user_id

    try {
      await axios.post(
        `${auth0MgmtDomain}/api/v2/users/${encodeURIComponent(userId)}/roles`,
        { roles: [auth0RoleId] },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (roleAssignError) {
      console.error('Failed to assign Auth0 role:', roleAssignError)
      try {
        await axios.delete(
          `${auth0ApiUrl}/${encodeURIComponent(userId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (cleanupError) {
        console.error('Failed to roll back Auth0 user after role assignment failure:', cleanupError)
      }
      return resp.status(500).json({ error: 'Failed to assign role to user in Auth0' })
    }

    try {

      const dbUser: User = await prisma.$transaction(async (tx: any) => {
        return tx.user.create({
          data: {
            id: userId,
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            role: requestedRole,
          },
        })
      })

      return resp.status(201).json(dbUser)
    } catch (dbError) {

      try {
        await axios.delete(
          `${auth0ApiUrl}/${encodeURIComponent(userId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
      catch (error) {
        return resp.status(500).json({ error: `Failed to delete user after failure to insert` })
      }
      resp.status(500).json({ error: 'Failed to create user in database' })
    }
  } catch (error) {
    console.error('Error creating profile:', error)
    resp.status(500).json({ error: 'Failed to create user in auth0' })
  }
}

export const listUsers = async (req: Request, resp: Response) => {
  try {
    const profiles = await fetchUsersFromDB()
    resp.status(200).json(profiles)
  } catch (error) {
    console.error('Error fetching profiles:', error)
    resp.status(500).json({ error: 'Failed to fetch profiles' })
  }
}

export const updateUser = async (req: Request, resp: Response): Promise<User | any> => {
  const userId = req.params.id
  const email = req.body.email
  const firstName = req.body.firstName
  const lastName = req.body.lastName
  const role = req.body.role

  if (!userId || !email || !firstName || !lastName || !role) {
    return resp.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const user = await upsertUserFromAuth0({
      id: userId,
      email: email,
      firstName: firstName,
      lastName: lastName,
      role: role
    })
    return resp.status(200).json(user)
  } catch (error) {
    console.error(`Error updating profile: ${error}`)
    return resp.status(500).json({ error: 'Failed to update user' })
  }
}

export const deactivateUser = async (req: Request, resp: Response) => {
  let user: User

  if (!req.params.id) {
    return resp.status(400).json({ message: "User ID is required" })
  }

  try {
    user = await deactivateUserDB(req.params.id)
  } catch (error: any) {
    console.error("Error deactivating user:", error)
    return resp.status(500).json({ error: "Failed to deactivate user in DB" })
  }

  try {
    await axios.patch(
      `${auth0MgmtDomain}/api/v2/users/${encodeURIComponent(req.params.id)}`,
      { blocked: true },
      { headers: { Authorization: `Bearer ${req.auth0ManagementToken}` } }
    )
  } catch (error: any) {
    console.error("Error deactivating user in Auth0:", error)
    return resp.status(500).json({ error: "Failed to deactivate user in Auth0" })
  }

  return resp.status(200).json(user)

}

export const activateUser = async (req: Request, resp: Response) => {
  let user: User

  if (!req.params.id) {
    return resp.status(400).json({ message: "User ID is required" })
  }

  try {
    user = await activateUserDB(req.params.id)
  } catch (error: any) {
    console.error("Error activating user in DB:", error)
    return resp.status(500).json({ error: "Failed to activate user in DB" })
  }

  try {
    await axios.patch(
      `${auth0MgmtDomain}/api/v2/users/${encodeURIComponent(req.params.id)}`,
      { blocked: false },
      { headers: { Authorization: `Bearer ${req.auth0ManagementToken}` } }
    )
    return resp.status(200).json({ message: "User activated successfully" })

  } catch (error: any) {
    console.error("Error activating user in Auth0:", error)
    return resp.status(500).json({ error: "Failed to activate user in Auth0" })
  }

}

export const removeUser = async (req: Request, resp: Response) => {
  if (!req.params.id) {
    return resp.status(400).json({ message: "User ID is required" })
  }

  const userId = req.params.id

  try {
    await axios.delete(
      `${auth0MgmtDomain}/api/v2/users/${encodeURIComponent(userId)}`,
      {
        headers: { Authorization: `Bearer ${req.auth0ManagementToken}` }
      })
  } catch (auth0Error) {
    return resp.status(500).json({ error: 'Failed to delete user from Auth0' })
  }

  try {
    const profile = await deleteUserFromDB(req.params.id)
    return resp.status(200).json(profile)
  } catch (dbError) {
    return resp.status(500).json({ error: `An error occured, we failed to delete user from database but deleted from auth0. ${dbError}` })
  }
}

export const sendChangePasswordRequest = async (req: Request, resp: Response) => {
  try {
    const result_url = `${process.env.BASEURL}`
    const token = req.auth0ManagementToken;
    console.log("App Client ID: ", process.env.AUTH0_FRONT_CLIENT_ID)
    const result = await axios.post(
      `${auth0MgmtDomain}/dbconnections/change_password`,
      {
        // result_url: process.env.BASEURL,
        // user_id: req.body.id,
        client_id: process.env.AUTH0_FRONT_CLIENT_ID,
        // connection_id: process.env.AUTH0_CONNECTION_ID,
        email: req.body.email,
        connection: "Username-Password-Authentication"
        // mark_email_as_verified: false,
        // includeEmailInRedirect: true
      },
      // {
      //   headers: { 
      //     Authorization: `Bearer ${token}`
      //   }
      // }
    );

    if (result) {
      return resp.status(200).json({
        message: "Password change email sent successfully",
        ticket: result.data.ticket
      });
    }
  } catch (error: any) {
    console.log("Error sending change password request", error)
    return resp.status(500).json({
      error: 'Failed to send password change email',
      message: error.response?.data?.message || error.message,
      details: error.response?.data
    });
  }
}
