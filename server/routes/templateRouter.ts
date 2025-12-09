import express from 'express'
import {
  // Template CRUD
  createTemplateController,
  getAllTemplatesController,
  getTemplateByIdController,
  updateTemplateController,
  deleteTemplateController,
  hardDeleteTemplateController,

  // Template Versioning
  getTemplateVersionsController,
  getTemplateVersionByIdController,
  createTemplateVersionController,
  activateTemplateVersionController,
  deleteTemplateVersionController,

  // Template Rules
  createTemplateRuleController,
  updateTemplateRuleController,
  deleteTemplateRuleController,
  getTemplateRulesController,
  getSectionRulesController,
  getFieldRulesController,
  getTemplateRulesByVersionController,
  getSectionRulesByVersionController,

  // Rule Category Controllers
  createSectionDependencyController,
  createFieldValidationController,
  createApprovalRequirementController,
  getRulesByTypeController,

  // Special endpoints
  getTemplateWithRulesController,

  // Legacy controllers
  createTemplateLegacy,
  listTemplatesLegacy,
  getTemplateByIdLegacy
} from '../controllers/templateController.js'
import authCheck from '../middleware/authCheck.js'
import { requireRole } from '../middleware/roleCheck.js'

const router = express.Router()

// With Auth (commented out for development)
router.use(authCheck)

/**
 * =========================
 * Template CRUD Routes
 * =========================
 */

// GET /api/templates - Get all active templates
router.get('/', getAllTemplatesController)

// GET /api/templates/:id - Get template by ID
router.get('/:id', getTemplateByIdController)

// GET /api/templates/:id/with-rules - Get template with rules and active version data
router.get('/:id/with-rules', getTemplateWithRulesController)

// POST /api/templates - Create new template
router.post('/', createTemplateController)

// PUT /api/templates/:id - Update template
router.put('/:id', updateTemplateController)

// DELETE /api/templates/:id - Soft delete template
router.delete('/:id', deleteTemplateController)

// DELETE /api/templates/:id/hard - Hard delete template (permanent)
router.delete('/:id/hard', hardDeleteTemplateController)

/**
 * =========================
 * Template Versioning Routes
 * =========================
 */

// GET /api/templates/:templateId/versions - Get all versions of a template
router.get('/:templateId/versions', getTemplateVersionsController)

// GET /api/templates/:templateId/versions/:versionId - Get specific version
router.get('/:templateId/versions/:versionId', getTemplateVersionByIdController)

// POST /api/templates/:templateId/versions - Create new version
router.post('/:templateId/versions', createTemplateVersionController)

// PUT /api/templates/:templateId/versions/:versionId/activate - Activate specific version
router.put('/:templateId/versions/:versionId/activate', activateTemplateVersionController)

// DELETE /api/templates/:templateId/versions/:versionId - Delete specific version
router.delete('/:templateId/versions/:versionId', deleteTemplateVersionController)

/**
 * =========================
 * Template Rules Routes
 * =========================
 */

// GET /api/templates/:templateId/rules - Get all rules for a template
router.get('/:templateId/rules', getTemplateRulesController)

// POST /api/templates/:templateId/rules - Create new rule
router.post('/:templateId/rules', createTemplateRuleController)

// PUT /api/templates/:templateId/rules/:ruleId - Update rule
router.put('/:templateId/rules/:ruleId', updateTemplateRuleController)

// DELETE /api/templates/:templateId/rules/:ruleId - Delete rule
router.delete('/:templateId/rules/:ruleId', deleteTemplateRuleController)

// GET /api/templates/:templateId/sections/:sectionId/rules - Get rules for specific section
router.get('/:templateId/sections/:sectionId/rules', getSectionRulesController)

// GET /api/templates/:templateId/sections/:sectionId/fields/:fieldId/rules - Get rules for specific field
router.get('/:templateId/sections/:sectionId/fields/:fieldId/rules', getFieldRulesController)

/**
 * =========================
 * Legacy Routes (for backward compatibility)
 * =========================
 */

// These routes are kept for backward compatibility but point to new controllers
// router.get('/legacy', listTemplates)
// router.post('/legacy', createTemplate)
// router.get('/legacy/:id', getTemplateById)

/**
 * =========================
 * Auth Routes (commented out for development)
 * =========================
 */

// With authentication and role-based access control (uncomment for production)
// router.use(authCheck)

// Admin-only routes
router.post('/', requireRole(['ADMIN']), createTemplateController)
router.put('/:id', requireRole(['ADMIN']), updateTemplateController)
router.delete('/:id', requireRole(['ADMIN']), deleteTemplateController)
router.delete('/:id/hard', requireRole(['ADMIN']), hardDeleteTemplateController)

// Version management (admin and supervisor)
router.post('/:templateId/versions', requireRole(['ADMIN', 'SUPERVISOR']), createTemplateVersionController)
router.put('/:templateId/versions/:versionId/activate', requireRole(['ADMIN', 'SUPERVISOR']), activateTemplateVersionController)
router.delete('/:templateId/versions/:versionId', requireRole(['ADMIN', 'SUPERVISOR']), deleteTemplateVersionController)

// Rules management (admin and supervisor)
router.post('/:templateId/rules', requireRole(['ADMIN', 'SUPERVISOR']), createTemplateRuleController)
router.put('/:templateId/rules/:ruleId', requireRole(['ADMIN', 'SUPERVISOR']), updateTemplateRuleController)
router.delete('/:templateId/rules/:ruleId', requireRole(['ADMIN', 'SUPERVISOR']), deleteTemplateRuleController)

// Read-only access for all authenticated users
router.get('/', requireRole(['ADMIN', 'SUPERVISOR', 'OPERATOR', 'QA', 'QC', 'MAINTENANCE', 'VIEWER']), getAllTemplatesController)
router.get('/:id', requireRole(['ADMIN', 'SUPERVISOR', 'OPERATOR', 'QA', 'QC', 'MAINTENANCE', 'VIEWER']), getTemplateByIdController)
router.get('/:id/with-rules', requireRole(['ADMIN', 'SUPERVISOR', 'OPERATOR', 'QA', 'QC', 'MAINTENANCE', 'VIEWER']), getTemplateWithRulesController)
router.get('/:templateId/versions', requireRole(['ADMIN', 'SUPERVISOR', 'OPERATOR', 'QA', 'QC', 'MAINTENANCE', 'VIEWER']), getTemplateVersionsController)
router.get('/:templateId/versions/:versionId', requireRole(['ADMIN', 'SUPERVISOR', 'OPERATOR', 'QA', 'QC', 'MAINTENANCE', 'VIEWER']), getTemplateVersionByIdController)
router.get('/:templateId/rules', requireRole(['ADMIN', 'SUPERVISOR', 'OPERATOR', 'QA', 'QC', 'MAINTENANCE', 'VIEWER']), getTemplateRulesController)
router.get("/:templateId/versions/:versionId/rules", requireRole(['ADMIN', 'SUPERVISOR', 'OPERATOR', 'QA', 'QC', 'MAINTENANCE', 'VIEWER']), getTemplateRulesByVersionController)
router.get('/:templateId/sections/:sectionId/rules', requireRole(['ADMIN', 'SUPERVISOR', 'OPERATOR', 'QA', 'QC', 'MAINTENANCE', 'VIEWER']), getSectionRulesController)
router.get('/:templateId/sections/:sectionId/fields/:fieldId/rules', requireRole(['ADMIN', 'SUPERVISOR', 'OPERATOR', 'QA', 'QC', 'MAINTENANCE', 'VIEWER']), getFieldRulesController)
router.get("/:templateId/sections/:sectionId/versions/:versionId/rules", requireRole(['ADMIN', 'SUPERVISOR', 'OPERATOR', 'QA', 'QC', 'MAINTENANCE', 'VIEWER']), getSectionRulesByVersionController)

// Rule category endpoints (temporarily without auth for testing)
router.post('/:templateId/rules/section-dependency', createSectionDependencyController)
router.post('/:templateId/rules/field-validation', createFieldValidationController)
router.post('/:templateId/rules/approval-requirement', createApprovalRequirementController)
router.get('/:templateId/rules/type/:ruleType', getRulesByTypeController)

export default router
