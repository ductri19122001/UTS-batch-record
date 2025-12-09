import express from "express";
import { getBatchRecordById, listBatchRecords, createBatchRecord } from "../controllers/batchRecordController.js";
import authCheck from "../middleware/authCheck.js";


const router = express.Router()

// router.use(authCheck)

router.get('/', listBatchRecords)
router.get('/:id', getBatchRecordById)
router.post('/', createBatchRecord)

export default router
