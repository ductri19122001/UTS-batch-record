// Template types - Updated for rule system v2
export interface CreateTemplateData {
  id?: string; // Optional custom ID
  title: string;
  description: string;
  data?: any;
  createdBy?: string;
}

export interface UpdateTemplateData {
  title?: string;
  description?: string;
  data?: any;
  userId?: string;
}

export interface CreateVersionData {
  templateId: string;
  version?: number;
  title: string;
  description: string;
  data: any;
  createdBy: string;
}

export interface CreateRuleData {
  templateVersionId?: string;
  templateId: string;
  ruleType: 'SECTION_DEPENDENCY' | 'FIELD_VALIDATION' | 'APPROVAL_REQUIREMENT';
  ruleData: any;
  targetSectionId?: string;
  targetFieldId?: string;
}

export interface SectionDependencyRule {
  type: 'section_dependency';
  sourceSectionId: string;
  targetSectionId: string;
  condition: 'completed' | 'approved';
  message?: string;
}

export interface FieldValidationRule {
  type: 'field_validation';
  validationType: 'range' | 'required' | 'pattern';
  validationData: any;
  message?: string;
}

export interface ApprovalRequirementRule {
  type: 'approval_requirement';
  requiredRole: string;
  message?: string;
}

export interface UpdateRuleData {
  ruleType?: string;
  ruleData?: any;
  targetSectionId?: string;
  targetFieldId?: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  activeVersion?: {
    id: string;
    version: number;
    title: string;
    description: string;
    data: any;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  rules?: Array<{
    id: string;
    ruleType: string;
    ruleData: any;
    targetSectionId?: string;
    targetFieldId?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  title: string;
  description: string;
  data: any;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TemplateRule {
  id: string;
  templateId: string;
  ruleType: 'SECTION_DEPENDENCY' | 'FIELD_VALIDATION' | 'APPROVAL_REQUIREMENT';
  ruleData: any;
  targetSectionId?: string;
  targetFieldId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateWithRules {
  id: string;
  title: string;
  description: string;
  data: any;
  sectionRules: TemplateRule[];
  fieldRules: TemplateRule[];
  businessRules: TemplateRule[];
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}
