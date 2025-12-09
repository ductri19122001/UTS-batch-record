import {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  hardDeleteTemplate,
  getTemplateVersions,
  getTemplateVersionById,
  createTemplateVersion,
  activateTemplateVersion,
  deleteTemplateVersion,
  createTemplateRule,
  updateTemplateRule,
  deleteTemplateRule,
  getTemplateRules,
  getSectionRules,
  getFieldRules,
  getTemplateWithRules,
  createSectionDependencyRule,
  createFieldValidationRule,
  createApprovalRequirementRule,
  getRulesByType,
  getSectionRulesByVersion,
} from "../services/templateServices.js";
import type { Request, Response } from "express";
import { getClientIp } from "../utils/getClientIp.js";

interface AuthenticatedRequest extends Request {
  auth?: {
    sub: string;
    [key: string]: any;
  };
}

export const createTemplateController = async (req: AuthenticatedRequest, resp: Response) => {
  try {
    const { id, title, description, data, createdBy } = req.body;

    if (!title || !description) {
      return resp.status(400).json({
        error: "Title and description are required"
      });
    }

    const userId = req.auth?.sub || createdBy;
    
    if (!userId) {
      return resp.status(400).json({
        error: "User ID is required (from JWT token or request body)"
      });
    }

    const ipAddress = getClientIp(req);
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    const template = await createTemplate({
      id,
      title,
      description,
      data: data || {},
      createdBy: userId,
    }, ipAddress, userAgent, req);

    resp.status(201).json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    resp.status(500).json({ error: "Failed to create template" });
  }
};

export const getAllTemplatesController = async (req: Request, resp: Response) => {
  try {
    const templates = await getAllTemplates();
    resp.status(200).json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    resp.status(500).json({ error: "Failed to fetch templates" });
  }
};

export const getTemplateByIdController = async (req: Request, resp: Response) => {
  if (!req.params.id) {
    return resp.status(400).json({ error: "Template ID is required" });
  }

  try {
    const template = await getTemplateById(req.params.id);

    if (!template) {
      return resp.status(404).json({ error: "Template not found" });
    }

    resp.status(200).json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    resp.status(500).json({ error: "Failed to fetch template" });
  }
};

export const updateTemplateController = async (req: AuthenticatedRequest, resp: Response) => {
  if (!req.params.id) {
    return resp.status(400).json({ error: "Template ID is required" });
  }

  try {
    const { title, description, data, userId: bodyUserId } = req.body;
    
    const userId = req.auth?.sub || bodyUserId;
    
    if (!userId) {
      return resp.status(400).json({ error: "User ID is required (from JWT token or request body)" });
    }

    const ipAddress = getClientIp(req);
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    const template = await updateTemplate(req.params.id, {
      title,
      description,
      data,
    }, userId, ipAddress, userAgent, req);

    resp.status(200).json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    resp.status(500).json({ error: "Failed to update template" });
  }
};

export const deleteTemplateController = async (req: AuthenticatedRequest, resp: Response) => {
  if (!req.params.id) {
    return resp.status(400).json({ error: "Template ID is required" });
  }

  try {
    const { userId: bodyUserId } = req.body;
    const userId = req.auth?.sub || bodyUserId;
    
    if (!userId) {
      return resp.status(400).json({ error: "User ID is required (from JWT token or request body)" });
    }

    const ipAddress = getClientIp(req);
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    const template = await deleteTemplate(req.params.id, userId, ipAddress, userAgent);
    resp.status(200).json(template);
  } catch (error) {
    console.error("Error deleting template:", error);
    resp.status(500).json({ error: "Failed to delete template" });
  }
};

export const hardDeleteTemplateController = async (req: AuthenticatedRequest, resp: Response) => {
  if (!req.params.id) {
    return resp.status(400).json({ error: "Template ID is required" });
  }

  try {
    const { userId: bodyUserId } = req.body;
    const userId = req.auth?.sub || bodyUserId;
    
    if (!userId) {
      return resp.status(400).json({ error: "User ID is required (from JWT token or request body)" });
    }

    const ipAddress = getClientIp(req);
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    await hardDeleteTemplate(req.params.id, userId, ipAddress, userAgent);
    resp.status(200).json({ message: "Template permanently deleted" });
  } catch (error) {
    console.error("Error hard deleting template:", error);
    resp.status(500).json({ error: "Failed to permanently delete template" });
  }
};


export const getTemplateVersionsController = async (req: Request, resp: Response) => {
  if (!req.params.templateId) {
    return resp.status(400).json({ error: "Template ID is required" });
  }

  try {
    const versions = await getTemplateVersions(req.params.templateId);
    resp.status(200).json(versions);
  } catch (error) {
    console.error("Error fetching template versions:", error);
    resp.status(500).json({ error: "Failed to fetch template versions" });
  }
};

export const getTemplateVersionByIdController = async (req: Request, resp: Response) => {
  const { templateId, versionId } = req.params;
  
  if (!versionId) {
    return resp.status(400).json({ error: "Version ID is required" });
  }

  try {
    const version = await getTemplateVersionById(versionId);

    if (!version) {
      return resp.status(404).json({ error: "Template version not found" });
    }

    if (templateId && version.templateId !== templateId) {
      return resp.status(400).json({ error: "Template ID mismatch" });
    }
    
    resp.status(200).json(version);
  } catch (error) {
    console.error("Error fetching template version:", error);
    resp.status(500).json({ error: "Failed to fetch template version" });
  }
};

export const createTemplateVersionController = async (req: AuthenticatedRequest, resp: Response) => {
  try {
    const { templateId, title, description, data, createdBy } = req.body;

    const userId = req.auth?.sub || createdBy;
    
    if (!templateId || !title || !description) {
      return resp.status(400).json({
        error: "Template ID, title, and description are required"
      });
    }

    if (!userId) {
      return resp.status(400).json({
        error: "User ID is required (from JWT token or request body)"
      });
    }

    const ipAddress = getClientIp(req);
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    const version = await createTemplateVersion({
      templateId,
      title,
      description,
      data: data || {},
      createdBy: userId,
    }, ipAddress, userAgent);

    resp.status(201).json(version);
  } catch (error) {
    console.error("Error creating template version:", error);
    resp.status(500).json({ error: "Failed to create template version" });
  }
};

export const activateTemplateVersionController = async (req: AuthenticatedRequest, resp: Response) => {
  if (!req.params.templateId || !req.params.versionId) {
    return resp.status(400).json({ error: "Template ID and Version ID are required" });
  }

  try {
    const { userId: bodyUserId } = req.body;
    const userId = req.auth?.sub || bodyUserId;
    
    if (!userId) {
      return resp.status(400).json({ error: "User ID is required (from JWT token or request body)" });
    }

    const ipAddress = getClientIp(req);
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    const version = await activateTemplateVersion(
      req.params.templateId,
      req.params.versionId,
      userId,
      ipAddress,
      userAgent
    );

    resp.status(200).json(version);
  } catch (error) {
    console.error("Error activating template version:", error);
    resp.status(500).json({ error: "Failed to activate template version" });
  }
};

export const deleteTemplateVersionController = async (req: AuthenticatedRequest, resp: Response) => {
  if (!req.params.versionId) {
    return resp.status(400).json({ error: "Version ID is required" });
  }

  try {
    const { userId: bodyUserId } = req.body;
    const userId = req.auth?.sub || bodyUserId;
    
    if (!userId) {
      return resp.status(400).json({ error: "User ID is required (from JWT token or request body)" });
    }

    const ipAddress = getClientIp(req);
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    await deleteTemplateVersion(req.params.versionId, userId, ipAddress, userAgent);
    resp.status(200).json({ message: "Template version deleted" });
  } catch (error) {
    console.error("Error deleting template version:", error);
    resp.status(500).json({ error: "Failed to delete template version" });
  }
};


export const createTemplateRuleController = async (req: AuthenticatedRequest, resp: Response) => {
  try {
    const { templateId, ruleType, ruleData, targetSectionId, targetFieldId, userId: bodyUserId } = req.body;

    const userId = req.auth?.sub || bodyUserId;

    if (!templateId || !ruleType || !ruleData) {
      return resp.status(400).json({
        error: "Template ID, rule type, and rule data are required"
      });
    }

    if (!userId) {
      return resp.status(400).json({ error: "User ID is required (from JWT token or request body)" });
    }

    const ipAddress = getClientIp(req);
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    const rule = await createTemplateRule({
      templateId,
      ruleType,
      ruleData,
      targetSectionId,
      targetFieldId,
    }, userId, ipAddress, userAgent);

    resp.status(201).json(rule);
  } catch (error) {
    console.error("Error creating template rule:", error);
    resp.status(500).json({ error: "Failed to create template rule" });
  }
};

export const updateTemplateRuleController = async (req: AuthenticatedRequest, resp: Response) => {
  if (!req.params.ruleId) {
    return resp.status(400).json({ error: "Rule ID is required" });
  }

  try {
    const { ruleType, ruleData, targetSectionId, targetFieldId, userId: bodyUserId } = req.body;
    
    const userId = req.auth?.sub || bodyUserId;
    
    if (!userId) {
      return resp.status(400).json({ error: "User ID is required (from JWT token or request body)" });
    }

    const ipAddress = getClientIp(req);
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    const rule = await updateTemplateRule(req.params.ruleId, {
      ruleType,
      ruleData,
      targetSectionId,
      targetFieldId,
    }, userId, ipAddress, userAgent);

    resp.status(200).json(rule);
  } catch (error) {
    console.error("Error updating template rule:", error);
    resp.status(500).json({ error: "Failed to update template rule" });
  }
};

export const deleteTemplateRuleController = async (req: AuthenticatedRequest, resp: Response) => {
  if (!req.params.ruleId) {
    return resp.status(400).json({ error: "Rule ID is required" });
  }

  try {
    const bodyUserId = req.body?.userId;
    const userId = req.auth?.sub || bodyUserId || 'system-user';

    const ipAddress = getClientIp(req);
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

    const rule = await deleteTemplateRule(req.params.ruleId, userId, ipAddress, userAgent);
    resp.status(200).json(rule);
  } catch (error) {
    console.error("Error deleting template rule:", error);
    resp.status(500).json({ error: "Failed to delete template rule" });
  }
};

export const getTemplateRulesController = async (req: Request, resp: Response) => {
  if (!req.params.templateId) {
    return resp.status(400).json({ error: "Template ID is required" });
  }

  try {
    const rules = await getTemplateRules(req.params.templateId);
    resp.status(200).json(rules);
  } catch (error) {
    console.error("Error fetching template rules:", error);
    resp.status(500).json({ error: "Failed to fetch template rules" });
  }
};

export const getTemplateRulesByVersionController = async (req: Request, resp: Response) => {
  if (!req.params.templateId || !req.params.versionId) {
    return resp.status(400).json({ error: "Template ID and Version ID are required" });
  }

  try {
    const rules = await getTemplateRules(req.params.templateId)
    return resp.status(200).json(rules);
  } catch (error) {
    console.error("Error fetching template rules by version:", error);
    return resp.status(500).json({ error: "Failed to fetch template rules by version" });
  }
}

export const getSectionRulesByVersionController = async (req: Request, resp: Response) => {
  if (!req.params.templateId || !req.params.sectionId || !req.params.versionId) {
    return resp.status(400).json({ error: "Template ID, Section ID, and Version ID are required" });
  }

  try {
    const rules = await getSectionRulesByVersion(req.params.templateId, req.params.sectionId, req.params.versionId)
    return resp.status(200).json(rules);
  } catch (error) {
    console.error("Error fetching section rules by version:", error);
    return resp.status(500).json({ error: "Failed to fetch section rules by version" });
  }
}

export const getSectionRulesController = async (req: Request, resp: Response) => {
  if (!req.params.templateId || !req.params.sectionId) {
    return resp.status(400).json({ error: "Template ID and Section ID are required" });
  }

  try {
    const rules = await getSectionRules(req.params.templateId, req.params.sectionId);
    resp.status(200).json(rules);
  } catch (error) {
    console.error("Error fetching section rules:", error);
    resp.status(500).json({ error: "Failed to fetch section rules" });
  }
};

export const getFieldRulesController = async (req: Request, resp: Response) => {
  if (!req.params.templateId || !req.params.sectionId || !req.params.fieldId) {
    return resp.status(400).json({ error: "Template ID, Section ID, and Field ID are required" });
  }

  try {
    const rules = await getFieldRules(
      req.params.templateId,
      req.params.sectionId,
      req.params.fieldId
    );
    resp.status(200).json(rules);
  } catch (error) {
    console.error("Error fetching field rules:", error);
    resp.status(500).json({ error: "Failed to fetch field rules" });
  }
};


export const getTemplateWithRulesController = async (req: Request, resp: Response) => {
  if (!req.params.id) {
    return resp.status(400).json({ error: "Template ID is required" });
  }

  try {
    const template = await getTemplateWithRules(req.params.id);

    if (!template) {
      return resp.status(404).json({ error: "Template not found" });
    }

    resp.status(200).json(template);
  } catch (error) {
    console.error("Error fetching template with rules:", error);
    resp.status(500).json({ error: "Failed to fetch template with rules" });
  }
};


export const createSectionDependencyController = async (req: Request, resp: Response) => {
  try {
    const { templateId, sourceSectionId, targetSectionId, condition, message } = req.body;

    console.log("Received data:", req.body);

    if (!templateId || !sourceSectionId || !targetSectionId || !condition) {
      console.error("Missing required fields");
      return resp.status(400).json({
        error: "Template ID, source section ID, target section ID and condition are required"
      });
    }

    const rule = await createSectionDependencyRule(templateId, {
      sourceSectionId,
      targetSectionId,
      condition,
      message,
    });

    resp.status(201).json(rule);
  } catch (error) {
    console.error("Error creating section dependency rule:", error);
    resp.status(500).json({ error: "Failed to create section dependency rule" });
  }
};

export const createFieldValidationController = async (req: Request, resp: Response) => {
  try {
    const { templateId, sectionId, fieldId, validationType, validationData, message } = req.body;

    if (!templateId || !sectionId || !fieldId || !validationType || !validationData) {
      return resp.status(400).json({
        error: "Template ID, section ID, field ID, validation type and validation data are required"
      });
    }

    const rule = await createFieldValidationRule(templateId, {
      sectionId,
      fieldId,
      validationType,
      validationData,
      message,
    });

    resp.status(201).json(rule);
  } catch (error) {
    console.error("Error creating field validation rule:", error);
    resp.status(500).json({ error: "Failed to create field validation rule" });
  }
};

export const createApprovalRequirementController = async (req: Request, resp: Response) => {
  try {
    const { templateId, sectionId, requiredRole, message } = req.body;

    if (!templateId || !sectionId || !requiredRole) {
      return resp.status(400).json({
        error: "Template ID, section ID and required role are required"
      });
    }

    const rule = await createApprovalRequirementRule(templateId, {
      sectionId,
      requiredRole,
      message,
    });

    resp.status(201).json(rule);
  } catch (error) {
    console.error("Error creating approval requirement rule:", error);
    resp.status(500).json({ error: "Failed to create approval requirement rule" });
  }
};

export const getRulesByTypeController = async (req: Request, resp: Response) => {
  try {
    const { templateId, ruleType } = req.params;

    if (!templateId || !ruleType) {
      return resp.status(400).json({
        error: "Template ID and rule type are required"
      });
    }

    const rules = await getRulesByType(templateId, ruleType);
    resp.status(200).json(rules);
  } catch (error) {
    console.error("Error fetching rules by type:", error);
    resp.status(500).json({ error: "Failed to fetch rules by type" });
  }
};

export const createTemplateLegacy = createTemplateController;
export const listTemplatesLegacy = getAllTemplatesController;
export const getTemplateByIdLegacy = getTemplateByIdController;
