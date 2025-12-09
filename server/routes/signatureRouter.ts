import express from 'express'
import { postSignature } from '../controllers/signatureController.js'
import authCheck from '../middleware/authCheck.js'

const router = express.Router()

router.use(authCheck)

router.post('/', postSignature)

export default router


