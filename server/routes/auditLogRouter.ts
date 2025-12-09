import express from 'express'
import { getAuditLogs, getAuditLogDetail, createAuditLog } from '../controllers/auditLogController.js'
import authCheck from '../middleware/authCheck.js'

const router = express.Router()

router.get('/', getAuditLogs)
router.get('/:id', getAuditLogDetail)
router.post('/', authCheck, createAuditLog)

export default router
