import Express from "express";
import {
  createApprovalRequestHandler,
  getApprovalRequestsHandler,
  approveChangeRequestHandler,
  getApprovalRequestByIdHandler,
  rejectApprovalRequestHandler
} from "../controllers/approvalRequestController.js";
import requireSignature from "../middleware/requireSignature.js";
import { getAllApprovalRequests } from "../services/batchRecordSectionServices.js";

const router = Express.Router()

// Get all approval requests (must come before param routes)
router.get("/", async (req, res) => {
  try {
    console.log('Fetching all approval requests...');
    const requests = await getAllApprovalRequests();
    console.log('Found requests:', requests.length);
    res.status(200).json(requests);
  } catch (error) {
    console.error('Get all approval requests error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: 'Failed to fetch approval requests', details: errorMessage });
  }
});

// Get approval requests for a batch record (must come before single ID route)
router.get("/batch/:batchRecordId", getApprovalRequestsHandler)

// Get a single approval request by ID
router.get("/:requestId", getApprovalRequestByIdHandler)

// Create approval request
router.post("/", createApprovalRequestHandler)

// Get approval requests for a batch record
router.get("/:batchRecordId", getApprovalRequestsHandler)

// Approve a change request (requires e-signature)
router.post(
  "/:requestId/approve",
  requireSignature({
    getExpectedUserId: (req) => String(req.body?.reviewedBy || ""),
    makeCanonicalPayload: (req) => ({
      action: "APPROVE_CHANGE_REQUEST",
      entityType: "ApprovalRequest",
      entityId: req.params.requestId,
      batchRecordId: req.body?.batchRecordId,
      sectionId: req.body?.sectionId
    }),
    maxAgeSeconds: Number(process.env.SIGNATURE_MAX_AGE_SECONDS || 300)
  }),
  approveChangeRequestHandler
)
// Reject an approval request
router.post("/:requestId/reject", rejectApprovalRequestHandler)

export default router
