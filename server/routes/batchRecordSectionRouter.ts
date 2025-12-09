import Express from "express";
import { addBRSection, fetchBRSection, fetchBatchRecordSectionsByID, fetchBRSectionHistory } from "../controllers/batchRecordSectionController.js";
import requireSignature from "../middleware/requireSignature.js";

const router = Express.Router()

router.get("/:batchRecordId/section/:sectionId/history", fetchBRSectionHistory)
router.get("/:batchRecordId/section/:sectionId", fetchBRSection)
router.get("/:batchRecordId", fetchBatchRecordSectionsByID)
// Section completion requires signature
router.post(
  "/:batchRecordId/section",
  requireSignature({
    getExpectedUserId: (req) => String(req.body?.userId || ""),
    makeCanonicalPayload: (req) => ({
      action: "COMPLETE_SECTION",
      entityType: "BatchRecordSection",
      batchRecordId: req.params.batchRecordId,
      sectionId: req.body?.sectionId,
      parentSectionId: req.body?.parentSectionId || null
    }),
    maxAgeSeconds: Number(process.env.SIGNATURE_MAX_AGE_SECONDS || 300)
  }),
  addBRSection
)
router.post(
  "/:batchRecordId/section/:sectionId",
  requireSignature({
    getExpectedUserId: (req) => String(req.body?.userId || ""),
    makeCanonicalPayload: (req) => ({
      action: "COMPLETE_SECTION",
      entityType: "BatchRecordSection",
      batchRecordId: req.params.batchRecordId,
      sectionId: req.params.sectionId || req.body?.sectionId,
      parentSectionId: req.body?.parentSectionId || null
    }),
    maxAgeSeconds: Number(process.env.SIGNATURE_MAX_AGE_SECONDS || 300)
  }),
  addBRSection
)

export default router