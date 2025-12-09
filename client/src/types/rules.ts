// Rule-specific types to avoid circular dependencies

export interface TemplateRule {
  id: string;
  templateId: string;
  templateVersionId?: string;
  ruleType: 'SECTION_DEPENDENCY' | 'FIELD_VALIDATION' | 'APPROVAL_REQUIREMENT' | 'BUSINESS_RULE';
  ruleData: any;
  targetSectionId?: string;
  targetFieldId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRuleData {
  templateVersionId?: string;
  templateId: string;
  ruleType: 'SECTION_DEPENDENCY' | 'FIELD_VALIDATION' | 'APPROVAL_REQUIREMENT';
  ruleData: any;
  targetSectionId?: string;
  targetFieldId?: string;
}

export interface UpdateRuleData {
  templateVersionId?: string;
  ruleType?: 'SECTION_DEPENDENCY' | 'FIELD_VALIDATION' | 'APPROVAL_REQUIREMENT';
  ruleData?: any;
  targetSectionId?: string;
  targetFieldId?: string;
  isActive?: boolean;
}

export interface SectionDependencyRule {
  type: 'section_dependency';
  sourceSectionId: string;
  targetSectionId: string;
  condition: 'COMPLETED' | 'APPROVED' | 'PENDING_APPROVAL';
  message?: string;
}

export interface FieldValidationRule {
  type: 'field_validation';
  validationType: 'REQUIRED' | 'RANGE' | 'PATTERN' | 'CUSTOM';
  validationData: any;
  targetFieldId?: string;
  message?: string;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface ApprovalRequirementRule {
  type: 'approval_requirement';
  requiredRole: string;
  message?: string;
}
