import express from 'express'
import { createUser, listUsers, removeUser, updateUser, deactivateUser, activateUser, sendChangePasswordRequest } from '../controllers/userController.js'
import authCheck from '../middleware/authCheck.js'
import { requireRole } from '../middleware/roleCheck.js'
import { getAuth0ManagementToken } from '../middleware/auth0Token.js'
import syncUser from '../middleware/syncUser.js'
import type { Request, Response } from 'express'


const router = express.Router()

router.use(authCheck)

// router.get('/', requireRole(['ADMIN']), listUsers)
router.get('/', listUsers)
// router.get("/", listUsers)
// router.post("/", requireRole(['ADMIN']), getAuth0ManagementToken, createUser)
router.post("/", getAuth0ManagementToken, createUser)
router.put("/activate/:id", getAuth0ManagementToken, activateUser)
router.put("/deactivate/:id", getAuth0ManagementToken, deactivateUser)
router.delete("/:id", getAuth0ManagementToken, removeUser)
router.put("/:id", getAuth0ManagementToken, updateUser)
router.post("/sync", syncUser, (req: Request, res: Response) => res.sendStatus(204))
router.post("/changePassword", sendChangePasswordRequest)


export default router
