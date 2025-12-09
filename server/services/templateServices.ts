import type { BatchRecordTemplate, TemplateVersion, TemplateRule, Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_USER_ID = "default-user-id";

// Type definitions
export interface CreateTemplateData {
  id: string;
  title: string;
  description: string;
  data: Prisma.InputJsonValue;
  createdBy?: string;
}

export interface UpdateTemplateData {
  title?: string;
  description?: string;
  data?: Prisma.InputJsonValue;
}

export interface CreateVersionData {
  templateId: string;
  version?: number;
  title: string;
  description: string;
  data: Prisma.InputJsonValue;
  createdBy: string;
}

export interface CreateRuleData {
  templateId: string;
  templateVersionId?: string;
  ruleType: string;
  ruleData: Prisma.InputJsonValue;
  targetSectionId?: string;
  targetFieldId?: string;
}

export interface UpdateRuleData {
  ruleType?: string;
  ruleData?: Prisma.InputJsonValue;
  targetSectionId?: string;
  targetFieldId?: string;
}

export interface TemplateWithVersionsAndRules extends Omit<BatchRecordTemplate, 'versions' | 'rules'> {
  versions: TemplateVersion[];
  rules: TemplateRule[];
}

export interface TemplateWithActiveVersion extends Omit<BatchRecordTemplate, 'versions' | 'rules'> {
  activeVersion: TemplateVersion | null;
  rules: TemplateRule[];
}



export async function createTemplate(data: CreateTemplateData): Promise<BatchRecordTemplate> {
  console.log(`Template Payload ${(JSON.stringify(data))}`);
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create the template with custom ID if provided
      const template = await tx.batchRecordTemplate.create({
        data: {
          id: data.id, // Use custom ID if provided
          title: data.title,
          description: data.description,
          createdBy: data.createdBy ?? DEFAULT_USER_ID,
          isActive: true,
        },
      });

      // Create initial version
      const version = await tx.templateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          title: data.title,
          description: data.description,
          data: data.data,
          isActive: true,
          createdBy: data.createdBy ?? DEFAULT_USER_ID,
        },
      });

      return template;
    });

    // console.log(`Successfully created template: ${result.id}`);
    return result;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

export async function getAllTemplates(): Promise<TemplateWithActiveVersion[]> {
  try {
    const templates = await prisma.batchRecordTemplate.findMany({
      where: {
        isActive: true,
      },
      include: {
        versions: {
          where: {
            isActive: true,
          },
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
        rules: {
          where: {
            isActive: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Transform to include activeVersion instead of versions array
    return templates.map(template => {
      const { versions, rules, ...rest } = template;
      return {
        ...rest,
        activeVersion: versions[0] ?? null,
        rules,
      };
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
}

export async function getTemplateById(id: string): Promise<TemplateWithActiveVersion | null> {
  try {
    const template = await prisma.batchRecordTemplate.findUnique({
      where: {
        id,
        isActive: true,
      },
      include: {
        versions: {
          where: {
            isActive: true,
          },
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
        rules: {
          where: {
            isActive: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!template) {
      return null;
    }

    const { versions, rules, ...rest } = template;
    return {
      ...rest,
      activeVersion: versions[0] ?? null,
      rules,
    };
  } catch (error) {
    console.error('Error fetching template by ID:', error);
    throw error;
  }
}

export async function updateTemplate(id: string, data: UpdateTemplateData): Promise<BatchRecordTemplate> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update template metadata
      const templateUpdateData: Prisma.BatchRecordTemplateUpdateInput = {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      };

      const template = await tx.batchRecordTemplate.update({
        where: { id },
        data: templateUpdateData,
      });

      // Get current active version
      const currentVersion = await tx.templateVersion.findFirst({
        where: {
          templateId: id,
          isActive: true,
        },
        orderBy: {
          version: 'desc',
        },
      });

      if (currentVersion) {
        // Deactivate current version
        await tx.templateVersion.update({
          where: { id: currentVersion.id },
          data: { isActive: false },
        });

        // Create new version
        await tx.templateVersion.create({
          data: {
            templateId: id,
            version: currentVersion.version + 1,
            title: data.title || currentVersion.title,
            description: data.description || currentVersion.description,
            data: data.data ?? currentVersion.data ?? {},
            isActive: true,
            createdBy: currentVersion.createdBy, // Use the same creator as the original version
          },
        });
      }

      return template;
    });

    // console.log(`Successfully updated template: ${result.id}`);
    return result;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

export async function deleteTemplate(id: string): Promise<BatchRecordTemplate> {
  try {
    const template = await prisma.batchRecordTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    // console.log(`Successfully soft deleted template: ${id}`);
    return template;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

export async function hardDeleteTemplate(id: string): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      // Delete template versions
      await tx.templateVersion.deleteMany({
        where: { templateId: id },
      });

      // Delete template rules
      await tx.templateRule.deleteMany({
        where: { templateId: id },
      });

      // Delete the template
      await tx.batchRecordTemplate.delete({
        where: { id },
      });
    });

    // console.log(`Successfully hard deleted template: ${id}`);
  } catch (error) {
    console.error('Error hard deleting template:', error);
    throw error;
  }
}

/**
 * =========================
 * Template Versioning
 * =========================
 */

export async function getTemplateVersions(templateId: string): Promise<TemplateVersion[]> {
  try {
    const versions = await prisma.templateVersion.findMany({
      where: { templateId },
      orderBy: { version: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return versions;
  } catch (error) {
    console.error('Error fetching template versions:', error);
    throw error;
  }
}

export async function getTemplateVersionById(versionId: string): Promise<TemplateVersion | null> {
  try {
    const version = await prisma.templateVersion.findUnique({
      where: { id: versionId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return version;
  } catch (error) {
    console.error('Error fetching template version:', error);
    throw error;
  }
}

export async function createTemplateVersion(data: CreateVersionData): Promise<TemplateVersion> {
  try {
    const nextVersion =
      data.version !== undefined
        ? data.version
        : ((await prisma.templateVersion.aggregate({
          where: { templateId: data.templateId },
          _max: { version: true },
        }))._max.version || 0) + 1;

    const version = await prisma.templateVersion.create({
      data: {
        templateId: data.templateId,
        version: nextVersion,
        title: data.title,
        description: data.description,
        data: data.data,
        createdBy: data.createdBy,
        isActive: true,
      },
    });

    // console.log(`Successfully created template version: ${version.id}`);
    return version;
  } catch (error) {
    console.error('Error creating template version:', error);
    throw error;
  }
}

export async function activateTemplateVersion(templateId: string, versionId: string): Promise<TemplateVersion> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Deactivate all versions for this template
      await tx.templateVersion.updateMany({
        where: { templateId },
        data: { isActive: false },
      });

      // Activate the specified version
      const activeVersion = await tx.templateVersion.update({
        where: { id: versionId },
        data: { isActive: true },
      });

      // Update template timestamp
      await tx.batchRecordTemplate.update({
        where: { id: templateId },
        data: { updatedAt: new Date() },
      });

      return activeVersion;
    });

    // console.log(`Successfully activated template version: ${versionId}`);
    return result;
  } catch (error) {
    console.error('Error activating template version:', error);
    throw error;
  }
}

export async function deleteTemplateVersion(versionId: string): Promise<void> {
  try {
    await prisma.templateVersion.delete({
      where: { id: versionId },
    });

    // console.log(`Successfully deleted template version: ${versionId}`);
  } catch (error) {
    console.error('Error deleting template version:', error);
    throw error;
  }
}

/**
 * =========================
 * Template Rules
 * =========================
 */

export async function createTemplateRule(data: CreateRuleData): Promise<TemplateRule> {
  try {
    const rule = await prisma.templateRule.create({
      data: {
        templateId: data.templateId,
        ruleType: data.ruleType,
        ruleData: data.ruleData,
        ...(data.targetSectionId !== undefined
          ? { targetSectionId: data.targetSectionId }
          : {}),
        ...(data.targetFieldId !== undefined
          ? { targetFieldId: data.targetFieldId }
          : {}),
      },
    });

    // console.log(`Successfully created template rule: ${rule.id}`);
    return rule;
  } catch (error) {
    console.error('Error creating template rule:', error);
    throw error;
  }
}

export async function updateTemplateRule(ruleId: string, data: UpdateRuleData): Promise<TemplateRule> {
  try {
    const updateData: Prisma.TemplateRuleUpdateInput = {
      ...(data.ruleType ? { ruleType: data.ruleType } : {}),
      ...(data.ruleData ? { ruleData: data.ruleData } : {}),
      ...(data.targetSectionId !== undefined ? { targetSectionId: data.targetSectionId } : {}),
      ...(data.targetFieldId !== undefined ? { targetFieldId: data.targetFieldId } : {}),
    };

    const rule = await prisma.templateRule.update({
      where: { id: ruleId },
      data: updateData,
    });

    // console.log(`Successfully updated template rule: ${ruleId}`);
    return rule;
  } catch (error) {
    console.error('Error updating template rule:', error);
    throw error;
  }
}

export async function deleteTemplateRule(ruleId: string): Promise<TemplateRule> {
  try {
    const rule = await prisma.templateRule.update({
      where: { id: ruleId },
      data: { isActive: false },
    });

    // console.log(`Successfully deleted template rule: ${ruleId}`);
    return rule;
  } catch (error) {
    console.error('Error deleting template rule:', error);
    throw error;
  }
}

export async function getTemplateRules(templateId: string): Promise<TemplateRule[]> {
  try {
    const rules = await prisma.templateRule.findMany({
      where: {
        templateId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rules;
  } catch (error) {
    console.error('Error fetching template rules:', error);
    throw error;
  }
}

export async function getSectionRules(templateId: string, sectionId: string): Promise<TemplateRule[]> {
  try {
    const rules = await prisma.templateRule.findMany({
      where: {
        templateId,
        targetSectionId: sectionId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rules;
  } catch (error) {
    console.error('Error fetching section rules:', error);
    throw error;
  }
}

export async function getSectionRulesByVersion(templateId: string, sectionId: string, _versionId: string): Promise<TemplateRule[]> {
  return getSectionRules(templateId, sectionId);
}


export async function getFieldRules(templateId: string, sectionId: string, fieldId: string): Promise<TemplateRule[]> {
  try {
    const rules = await prisma.templateRule.findMany({
      where: {
        templateId,
        targetSectionId: sectionId,
        targetFieldId: fieldId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rules;
  } catch (error) {
    console.error('Error fetching field rules:', error);
    throw error;
  }
}

/**
 * =========================
 * Special Endpoints
 * =========================
 */

export async function getTemplateWithRules(id: string): Promise<any> {
  try {
    const template = await prisma.batchRecordTemplate.findUnique({
      where: {
        id,
        isActive: true,
      },
      include: {
        versions: {
          where: {
            isActive: true,
          },
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
        rules: {
          where: {
            isActive: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!template) {
      return null;
    }

    const activeVersion = template.versions[0] ?? null;

    const sectionRules = template.rules.filter(rule => rule.ruleType === 'SECTION_DEPENDENCY');
    const fieldRules = template.rules.filter(rule => rule.ruleType === 'FIELD_VALIDATION');
    const businessRules = template.rules.filter(rule => rule.ruleType === 'BUSINESS_RULE');

    return {
      id: template.id,
      title: template.title,
      description: template.description,
      data: activeVersion?.data ?? {},
      sectionRules,
      fieldRules,
      businessRules,
      creator: template.creator,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching template with rules:', error);
    throw error;
  }
}


export async function createSectionDependencyRule(
  templateId: string,
  data: {
    sourceSectionId: string;
    targetSectionId: string;
    condition: 'completed' | 'approved';
    message?: string;
  }
): Promise<TemplateRule> {
  return createTemplateRule({
    templateId,
    ruleType: 'SECTION_DEPENDENCY',
    ruleData: {
      type: 'section_dependency',
      sourceSectionId: data.sourceSectionId,
      targetSectionId: data.targetSectionId,
      condition: data.condition,
      message: data.message || `Complete ${data.sourceSectionId} before ${data.targetSectionId}`,
    },
    targetSectionId: data.targetSectionId,
  });
}

export async function createFieldValidationRule(
  templateId: string,
  data: {
    sectionId: string;
    fieldId: string;
    validationType: 'range' | 'required' | 'pattern';
    validationData: any;
    message?: string;
  }
): Promise<TemplateRule> {
  return createTemplateRule({
    templateId,
    ruleType: 'FIELD_VALIDATION',
    ruleData: {
      type: 'field_validation',
      validationType: data.validationType,
      validationData: data.validationData,
      message: data.message || `Field validation failed`,
    },
    targetSectionId: data.sectionId,
    targetFieldId: data.fieldId,
  });
}

export async function createApprovalRequirementRule(
  templateId: string,
  data: {
    sectionId: string;
    requiredRole: string;
    message?: string;
  }
): Promise<TemplateRule> {
  return createTemplateRule({
    templateId,
    ruleType: 'APPROVAL_REQUIREMENT',
    ruleData: {
      type: 'approval_requirement',
      requiredRole: data.requiredRole,
      message: data.message || `Section requires ${data.requiredRole} approval`,
    },
    targetSectionId: data.sectionId,
  });
}

export async function getRulesByType(templateId: string, ruleType: string): Promise<TemplateRule[]> {
  try {
    const rules = await prisma.templateRule.findMany({
      where: {
        templateId,
        ruleType,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rules;
  } catch (error) {
    console.error('Error fetching rules by type:', error);
    throw error;
  }
}
