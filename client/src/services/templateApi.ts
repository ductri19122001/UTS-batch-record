// Template API Service
// Handles all API calls related to template management

import type {
  CreateTemplateData,
  UpdateTemplateData,
  CreateVersionData,
  Template,
  TemplateVersion,
  TemplateWithRules
} from '../types/template';
import type {
  CreateRuleData,
  UpdateRuleData,
  TemplateRule
} from '../types/rules';

const API_BASE_URL = `${import.meta.env.VITE_API_SERVER_URL}/api/templates`;

/**
 * =========================
 * Template CRUD Operations
 * =========================
 */


export const createTemplate = async (data: CreateTemplateData, token: string): Promise<Template> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create template');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

export const getAllTemplates = async (token: string): Promise<Template[]> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch templates');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

export const getTemplateById = async (id: string, token: string): Promise<Template> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch template');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
};

export const updateTemplate = async (id: string, data: UpdateTemplateData, token: string): Promise<Template> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update template');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

export const deleteTemplate = async (id: string, token: string): Promise<Template> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete template');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};

export const hardDeleteTemplate = async (id: string, token: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}/hard`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to permanently delete template');
    }
  } catch (error) {
    console.error('Error hard deleting template:', error);
    throw error;
  }
};

/**
 * =========================
 * Template Versioning Operations
 * =========================
 */

export const getTemplateVersions = async (templateId: string, token: string): Promise<TemplateVersion[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${templateId}/versions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch template versions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching template versions:', error);
    throw error;
  }
};

export const getTemplateVersionById = async (templateId: string, versionId: string, token: string): Promise<TemplateVersion> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${templateId}/versions/${versionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch template version');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching template version:', error);
    throw error;
  }
};

export const createTemplateVersion = async (data: CreateVersionData, token: string): Promise<TemplateVersion> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${data.templateId}/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create template version');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating template version:', error);
    throw error;
  }
};

export const activateTemplateVersion = async (templateId: string, versionId: string, token: string): Promise<TemplateVersion> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${templateId}/versions/${versionId}/activate`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to activate template version');
    }

    return await response.json();
  } catch (error) {
    console.error('Error activating template version:', error);
    throw error;
  }
};

export const deleteTemplateVersion = async (templateId: string, versionId: string, token: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${templateId}/versions/${versionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete template version');
    }
  } catch (error) {
    console.error('Error deleting template version:', error);
    throw error;
  }
};

/**
 * =========================
 * Template Rules Operations
 * =========================
 */

export const createTemplateRule = async (data: CreateRuleData, token: string): Promise<TemplateRule> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${data.templateId}/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        templateId: data.templateId,
        ruleType: data.ruleType,
        ruleData: data.ruleData,
        ...(data.targetSectionId !== undefined ? { targetSectionId: data.targetSectionId } : {}),
        ...(data.targetFieldId !== undefined ? { targetFieldId: data.targetFieldId } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create template rule');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating template rule:', error);
    throw error;
  }
};

export const updateTemplateRule = async (templateId: string, ruleId: string, data: UpdateRuleData, token: string): Promise<TemplateRule> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${templateId}/rules/${ruleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update template rule');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating template rule:', error);
    throw error;
  }
};

export const deleteTemplateRule = async (templateId: string, ruleId: string, token: string): Promise<TemplateRule> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${templateId}/rules/${ruleId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete template rule');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting template rule:', error);
    throw error;
  }
};

export const getTemplateRules = async (templateId: string, token: string): Promise<TemplateRule[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${templateId}/rules`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch template rules');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching template rules:', error);
    throw error;
  }
};

export const getTemplateRulesByVersion = async (templateId: string, versionId: string, token: string): Promise<TemplateRule[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${templateId}/versions/${versionId}/rules`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch template rules');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching template rules:', error);
    throw error;
  }
};

export const getSectionRules = async (templateId: string, sectionId: string, token: string): Promise<TemplateRule[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${templateId}/sections/${sectionId}/rules`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch section rules');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching section rules:', error);
    throw error;
  }
};

export const getFieldRules = async (templateId: string, sectionId: string, fieldId: string, token: string): Promise<TemplateRule[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${templateId}/sections/${sectionId}/fields/${fieldId}/rules`, {
      headers: {
        authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch field rules');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching field rules:', error);
    throw error;
  }
};

/**
 * =========================
 * Special Endpoints
 * =========================
 */

export const getTemplateWithRules = async (id: string, token: string): Promise<TemplateWithRules> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}/with-rules`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      // Try to parse error as JSON, fallback to status text
      let errorMessage = `Failed to fetch template with rules: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If response is not JSON (e.g., HTML error page), use status text
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching template with rules:', error);
    throw error;
  }
};

/**
 * =========================
 * Rule Category API Functions
 * =========================
 */

export const createSectionDependencyRule = async (
  templateId: string,
  data: {
    sourceSectionId: string;
    targetSectionId: string;
    condition: 'completed' | 'approved';
    message?: string;
  },
  token: string
): Promise<TemplateRule> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${templateId}/rules/section-dependency`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        templateId,
        ...data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create section dependency rule');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating section dependency rule:', error);
    throw error;
  }
};

export const createFieldValidationRule = async (
  templateId: string,
  data: {
    sectionId: string;
    fieldId: string;
    validationType: 'range' | 'required' | 'pattern';
    validationData: any;
    message?: string;
  },
  token: string
): Promise<TemplateRule> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${templateId}/rules/field-validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        templateId,
        ...data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create field validation rule');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating field validation rule:', error);
    throw error;
  }
};

export const createApprovalRequirementRule = async (
  templateId: string,
  data: {
    sectionId: string;
    requiredRole: string;
    message?: string;
  },
  token: string
): Promise<TemplateRule> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${templateId}/rules/approval-requirement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        templateId,
        ...data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create approval requirement rule');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating approval requirement rule:', error);
    throw error;
  }
};

export const getRulesByType = async (templateId: string, ruleType: string, token: string): Promise<TemplateRule[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/${templateId}/rules/type/${ruleType}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch rules by type');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching rules by type:', error);
    throw error;
  }
};

/**
 * =========================
 * Legacy Functions (for backward compatibility)
 * =========================
 */

// Legacy function names for backward compatibility
export const fetchTemplates = getAllTemplates;
export const addTemplate = createTemplate;
export const fetchTemplateById = getTemplateById;
