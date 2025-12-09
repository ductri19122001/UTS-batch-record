import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import FormSectionRenderer from "./FormSectionRenderer";
import FormSidebar from "./FormSideBar";
import SectionVersionHistory from "./SectionVersionHistory";
import ApprovalRequestDialog from "./ApprovalRequestDialog";
import ElectronicSignatureDialog from "./ElectronicSignatureDialog";
import SectionStatusIndicator, {
  type SectionStatus,
} from "./SectionStatusIndicator";
import axios from "axios";
import type { Section, BaseField, ApprovalDialogState } from "@/lib/types";
import { useAuth0 } from "@auth0/auth0-react";
import { useReAuthentication } from "@/hooks/useReAuthentication";
import { useUserRoles } from "@/hooks/useUserRoles";
import type { TemplateRule, FieldValidationRule } from "@/types/rules";
import {
  buildVersionHistoryPayload,
  cloneHistoryData,
  type VersionHistoryApprovalRequest,
} from "./historyDataHelpers";

interface FormRendererProps {
  batchRecordId: string
  forceReadOnly?: boolean
}

interface ElectronicSignatureData {
  entityType: string;
  entityId: string;
  canonicalPayload: Record<string, unknown>;
  batchRecordId?: string;
  sectionRecordId?: string;
  onSigned: (signatureId: string) => void;
}

const FormRenderer = ({ batchRecordId, forceReadOnly = false }: FormRendererProps) => {
  const [template, setTemplate] = useState<Record<string, any>>({});
  const [sectionData, setSectionData] = useState<Record<string, any>>({});
  const [activeSectionId, setActiveSectionId] = useState<string>("materials");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [batchRecordInfo, setBatchRecordInfo] = useState<Record<string, any>>(
    {}
  );
  const [showVersionHistory, setShowVersionHistory] = useState<boolean>(false);
  const [versionViewData, setVersionViewData] = useState<Record<string, any> | null>(null);
  const [versionViewFlatData, setVersionViewFlatData] = useState<Record<string, any> | null>(null);
  const [historyTargetSection, setHistoryTargetSection] = useState<Section | null>(null);
  const [approvalDialogState, setApprovalDialogState] =
    useState<ApprovalDialogState | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState<boolean>(false);
  const [showSignatureDialog, setShowSignatureDialog] =
    useState<boolean>(false);
  const [signatureDialogState, setSignatureDialogState] = useState<ElectronicSignatureData | null>(null);
  type SectionStatusEntry = {
    status: SectionStatus;
    lockedAt?: string;
    lockedBy?: string;
    version?: number;
  };
  const [sectionStatuses, setSectionStatuses] = useState<
    Record<string, SectionStatusEntry>
  >({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const serverPath = import.meta.env.VITE_API_SERVER_URL as string;
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const { requireReAuth } = useReAuthentication();
  const { isViewer } = useUserRoles();
  const globalReadOnly = forceReadOnly || isViewer;
  const [dependencyRules, setdependencyRules] = useState<Record<string, TemplateRule[]>>({});
  const [validationRules, setValidationRules] = useState<Record<string, TemplateRule[]>>({});
  const [approvalRules, setApprovalRules] = useState<Record<string, TemplateRule[]>>({});
  const [validationErrors, setValidationErrors] = useState<string[] | null>(null);

  const openApprovalDialog = (dialogState: ApprovalDialogState) => {
    if (globalReadOnly) {
      console.warn("Read-only mode active; approval dialog will not open.");
      return;
    }
    const clone = <T,>(value: T): T =>
      JSON.parse(JSON.stringify(value ?? {})) as T;

    setApprovalDialogState({
      ...dialogState,
      currentValues: clone(dialogState.currentValues),
      existingValues: clone(dialogState.existingValues),
    });
    setShowApprovalDialog(true);
  };

  const getToken = useCallback(async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: "openid profile email",
      },
    });
    return token;
  }, [getAccessTokenSilently]);

  const getTemplateData = async (templateId: string, templateVersionId: string) => {
    try {
      const token = await getToken();
      const [versionResponse, rulesResponse] = await Promise.all([
        axios.get(`${serverPath}/api/templates/${templateId}/versions/${templateVersionId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        axios.get(`${serverPath}/api/templates/${templateId}/rules`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ])
      const versionPayload = versionResponse.data

      if (!versionPayload) {
        console.error("Template version payload is empty");
        return;
      }

      const templateData = versionPayload?.data ?? {};

      if (
        !(templateData as any)?.sections ||
        !Array.isArray((templateData as any).sections)
      ) {
        console.warn("Template data does not contain sections array");
      }

      setTemplate(templateData as Record<string, any>);
      sortRulesBySection(rulesResponse.data as TemplateRule[])
    } catch (error: any) {
      console.error("Error fetching template:", error);
    }
  };

  const sortRulesBySection = (rules: TemplateRule[]) => {
    rules.forEach(rule => {
      const sectionKey = rule.targetSectionId || 'GLOBAL';
      switch (rule.ruleType) {
        case 'SECTION_DEPENDENCY':
          setdependencyRules(prev => ({
            ...prev,
            [sectionKey]: [...prev[sectionKey] || [], rule]
          }))
          break;
        case 'FIELD_VALIDATION':
          setValidationRules(prev => ({
            ...prev,
            [sectionKey]: [...prev[sectionKey] || [], rule]
          }))
          break;
        case 'APPROVAL_REQUIREMENT':
          setApprovalRules(prev => ({
            ...prev,
            [sectionKey]: [...prev[sectionKey] || [], rule]
          }))
          break;
        case 'BUSINESS_RULE':
          //Business Rules not implemented yet
          // setBusinessRules(prev => ({
          //   ...prev,
          //   [sectionKey]: [...prev[sectionKey] || [], rule]
          // }))
          break;
        default:
          console.error(`Unknown Rule Type: ${rule.ruleType} for Section: ${rule.targetSectionId}`);
      }
    })
    // console.log(`Dependency Rules: ${JSON.stringify(dependencyRules)}`);
  }



  const getBatchRecordInfo = async (batchRecordId: string) => {
    if (!batchRecordId) {
      return;
    }

    try {
      const response = await axios.get(
        `${serverPath}/api/batchRecords/${batchRecordId}`
      );
      const batchInfo = response.data;
      setBatchRecordInfo(batchInfo);
    } catch (error: any) {
      console.error("Error fetching batch record info:", error);
    }
  };

  const flattenSectionsFromResponse = (
    sections: Record<string, any>,
    metadata: Record<string, any>
  ) => {
    const flattened: Record<string, any> = {};

    const visit = (sectionId: string, data: any) => {
      flattened[sectionId] = data;

      if (!data || typeof data !== "object") return;

      Object.entries(data).forEach(([key, value]) => {
        if (
          metadata?.[key] &&
          value !== null &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          visit(key, value);
        }
      });
    };

    Object.entries(sections || {}).forEach(([sectionId, data]) =>
      visit(sectionId, data)
    );

    return flattened;
  };

  const normaliseSectionsStatuses = (
    metadata: Record<string, any>
  ): Record<string, SectionStatusEntry> => {
    return Object.entries(metadata || {}).reduce(
      (acc, [sectionId, meta]) => {
        acc[sectionId] = {
          status: (meta.status || "DRAFT") as SectionStatus,
          lockedAt: meta.lockedAt ?? undefined,
          lockedBy: meta.lockedBy ?? undefined,
          version: typeof meta.version === "number" ? meta.version : undefined,
        };
        return acc;
      },
      {} as Record<string, SectionStatusEntry>
    );
  };

  const deriveParentStatuses = (
    sections: Section[] | undefined,
    statuses: Record<string, SectionStatusEntry>
  ): Record<string, SectionStatusEntry> => {
    const next: Record<string, SectionStatusEntry> = { ...statuses };

    const visit = (section: Section) => {
      if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach(visit);

        const childStatuses = section.subsections.map(
          (subsection) => next[subsection.id]?.status
        );
        const allChildrenResolved = section.subsections.every((subsection) => {
          const status = next[subsection.id]?.status;
          return (
            status === "COMPLETED" ||
            status === "PENDING_APPROVAL" ||
            status === "APPROVED" ||
            status === "APPROVED_FOR_CHANGE"
          );
        });
        const anyChildPending = childStatuses.some(
          (status) => status === "PENDING_APPROVAL"
        );

        const current =
          next[section.id] ??
          statuses[section.id] ?? {
            status: "DRAFT" as SectionStatus,
          };
        let derivedStatus = current.status;

        const shouldPreserveCurrent =
          current.status === "PENDING_APPROVAL" ||
          current.status === "APPROVED_FOR_CHANGE" ||
          current.status === "APPROVED";

        if (shouldPreserveCurrent) {
          derivedStatus = current.status;
        } else if (anyChildPending) {
          derivedStatus = "PENDING_APPROVAL";
        } else if (allChildrenResolved && childStatuses.length > 0) {
          derivedStatus = "COMPLETED";
        } else if (current.status === "COMPLETED") {
          derivedStatus = current.status;
        } else {
          derivedStatus = "DRAFT";
        }

        const hasStatusChanged = derivedStatus !== current.status;

        next[section.id] = {
          ...current,
          status: derivedStatus,
          lockedAt: hasStatusChanged
            ? derivedStatus === "COMPLETED"
              ? current.lockedAt
              : undefined
            : current.lockedAt,
          lockedBy: hasStatusChanged
            ? derivedStatus === "COMPLETED"
              ? current.lockedBy
              : undefined
            : current.lockedBy,
          version: current.version,
        };
      }
    };

    sections?.forEach(visit);
    return next;
  };

  const lastFetchedVersionsRef = useRef<Record<string, number | undefined>>({});

  const flattenSectionSnapshot = useCallback(
    (sectionId: string, data: any) => {
      const flattened: Record<string, any> = {};

      const visit = (targetId: string, value: any) => {
        flattened[targetId] = value;

        if (!value || typeof value !== "object" || Array.isArray(value)) {
          return;
        }

        Object.entries(value).forEach(([key, nested]) => {
          if (
            sectionStatuses[key] &&
            nested !== null &&
            typeof nested === "object" &&
            !Array.isArray(nested)
          ) {
            visit(key, nested);
          }
        });
      };

      visit(sectionId, data ?? {});
      return flattened;
    },
    [sectionStatuses]
  );

  const getBatchRecordData = async () => {
    if (!batchRecordId) {
      console.warn("No batchRecordId provided to getBatchRecordData");
      return;
    }

    if (!template?.sections) {
      console.warn(
        "Template sections are not loaded yet; skipping batch record data fetch."
      );
      return;
    }

    try {
      const url = `${serverPath}/api/batchRecordSections/${batchRecordId}`
      // Add cache-busting to ensure fresh data
      const response = await axios.get(url, {
        params: { _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache' }
      })

      const sections = response.data?.sections ?? {};
      const metadata = response.data?.metadata ?? {};

      const flattenedSections = flattenSectionsFromResponse(sections, metadata);
      setSectionData(flattenedSections);
      const normalisedSectionsStatuses = normaliseSectionsStatuses(metadata);
      const aggregatedStatuses = deriveParentStatuses(
        template.sections,
        normalisedSectionsStatuses
      );
      setSectionStatuses(aggregatedStatuses);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!batchRecordId) return;
    void getBatchRecordInfo(batchRecordId);
  }, [batchRecordId]);

  // useEffect(() => {
  //   if (versionViewData) {
  //     console.log('versionViewData state updated', versionViewData)
  //   }
  // }, [versionViewData]);

  useEffect(() => {
    if (batchRecordId && template?.sections) {
      void getBatchRecordData();
    }
  }, [batchRecordId, template]);

  useEffect(() => {
    if (batchRecordInfo.templateId && batchRecordInfo.templateVersionId) {
      getTemplateData(batchRecordInfo.templateId, batchRecordInfo.templateVersionId);
    } else {
      console.warn("Batch record missing template info");
    }
  }, [batchRecordInfo]);

  useEffect(() => {
    if (template?.sections && template.sections.length > 0) {
      console.log("Setting active section to first section:", template.sections[0].id);
      setActiveSectionId(template.sections[0].id);
    }
  }, [template.sections]);

  // Refresh data when page becomes visible (e.g., returning from approvals page)
  useEffect(() => {
    if (!batchRecordId || !template?.sections) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Delay refresh slightly to ensure backend has processed the approval
        setTimeout(() => {
          void getBatchRecordData()
        }, 500)
      }
    }

    const handleFocus = () => {
      // Delay refresh slightly to ensure backend has processed the approval
      setTimeout(() => {
        void getBatchRecordData()
      }, 500)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [batchRecordId, template])


  const validateDataAgainstTemplate = (sectionData: any, templateSection: any): boolean => {
    const errors: string[] = []

    // Required fields
    const requiredFields = templateSection.fields?.filter((field: BaseField) => field.required) || []
    for (const field of requiredFields) {
      const value = sectionData[field.name]
      if (value === undefined || value === null || value === '') {
        errors.push(`Missing required field: ${field.label ?? field.name}`)
      }
    }

    // Primitive type checks
    for (const field of templateSection.fields || []) {
      if (sectionData[field.name] !== undefined && !validateFieldType(sectionData[field.name], field)) {
        errors.push(`Field ${field.label ?? field.name} has an invalid value`)
      }
    }

    // Rule-based validation (regex / range)
    const sectionValidationRules = validationRules[templateSection.id] || []
    // console.log(`Found ${sectionValidationRules.length} validation rules for section ${templateSection.id}`);
    for (const rule of sectionValidationRules) {
      // console.log(`Validating rule for section ${templateSection.id}: ${JSON.stringify(rule)}`);
      const data = rule.ruleData as FieldValidationRule
      const targetFieldId = data.targetFieldId || data.validationData?.fieldId || rule.targetFieldId
      if (!targetFieldId) {
        continue
      }

      const fieldDefinition =
        templateSection.fields?.find(
          (field: BaseField) =>
            field.id === targetFieldId || field.name === targetFieldId
        ) ?? null

      const valueKey =
        fieldDefinition?.name ??
        fieldDefinition?.id ??
        targetFieldId

      const rawValue = sectionData[valueKey]
      let valid = true
      const validationType = data.validationType?.toString().toUpperCase();

      if (validationType === 'PATTERN') {
        const pattern = data.pattern || data.validationData?.pattern
        if (!pattern) {
          continue
        }
        if (typeof rawValue !== 'string' || !(new RegExp(pattern).test(rawValue))) {
          valid = false
        }
      } else if (validationType === 'RANGE') {
        const min = data.min ?? data.validationData?.min
        const max = data.max ?? data.validationData?.max
        const numericValue = Number(rawValue)
        // console.log(`Validating RANGE for field ${targetFieldId}: value=${numericValue}, min=${min}, max=${max}`);
        if (!Number.isFinite(numericValue)) {
          valid = false
        } else {
          if (min !== undefined && numericValue < Number(min)) {
            valid = false
          }
          if (max !== undefined && numericValue > Number(max)) {
            valid = false
          }
        }
      }

      if (!valid) {
        errors.push(data.message ?? rule.ruleData?.message ?? `Field ${targetFieldId} failed validation`)
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors)
      return false
    }

    setValidationErrors(null)
    return true
  };

  const validateFieldType = (value: any, field: any): boolean => {
    switch (field.type) {
      case "text":
      case "textarea":
        return typeof value === "string";
      case "number":
        return typeof value === "number";
      case "table":
        return value.rows && Array.isArray(value.rows);
      case "select":
        return field.options?.includes(value);
      default:
        return true;
    }
  };

  const findSectionInTemplate = (
    sections: Section[],
    targetId: string
  ): Section | null => {
    for (const section of sections) {
      if (section.id === targetId) {
        return section;
      }
      // Search in subsections recursively
      if (section.subsections) {
        const found = findSectionInTemplate(section.subsections, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleSectionSave = async (sectionId: string, data: any, parentSectionId?: string) => {
    if (globalReadOnly) {
      console.warn(`Read-only mode active; ignoring save for section ${sectionId}`)
      return
    }
    const templateSection = findSectionInTemplate(template.sections || [], sectionId)

    if (!templateSection) {
      console.error(`Template section not found: ${sectionId}`);
      return;
    }

    if (!validateDataAgainstTemplate(data, templateSection)) {
      console.error(`Data validation failed for section ${sectionId}`);
      return;
    }

    if (!user?.sub || !isAuthenticated) {
      setSaveError("User not authenticated");
      return;
    }

    const reAuthPassed = await requireReAuth();
    if (!reAuthPassed) {
      return;
    }

    const sectionNeedsApproval = (approvalRules[sectionId] && approvalRules[sectionId].length > 0);

    // console.log(`Saving section ${sectionId}${parentSectionId ? ` with parent: ${parentSectionId}` : ''}`)
    console.log(`Section needs approval: ${sectionNeedsApproval}`)

    const canonicalPayload = {
      action: "COMPLETE_SECTION",
      entityType: "BatchRecordSection",
      batchRecordId,
      sectionId,
      parentSectionId: parentSectionId || null,
    };

    setSignatureDialogState({
      entityType: "BatchRecordSection",
      entityId: sectionId,
      canonicalPayload,
      batchRecordId,
      onSigned: async (signatureId: string) => {
        try {
          setSaveError(null);
          const token = await getToken();
          const userId = user?.sub;

          const payload = {
            sectionId,
            sectionData: data,
            userId: userId,
            signatureId,
            ...(parentSectionId && { parentSectionId }),
            sectionName: sectionData.sectionName || "",
          };

          const response = await axios.post(
            `${serverPath}/api/batchRecordSections/${batchRecordId}/section`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          if (response.status === 201 || response.status === 200) {
            if (sectionNeedsApproval) {
              //submit approval request 
              const approvalPayload = {
                batchRecordId,
                sectionId,
                requestType: "SECTION_APPROVAL",
                reason: "APPROVAL_REQUIRED",
                parentSectionId: parentSectionId ?? null,
                existingData: {},
                proposedData: data,
                userId: userId
              };

              // console.log(`Request URL for Approval: ${serverPath}/api/approvalRequests`);

              try {
                await axios.post(
                  `${serverPath}/api/approvalRequests`,
                  approvalPayload,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
              } catch (error) {
                setSaveError(`Failed to submit approval request for section ${sectionId}`)
                console.error('Error submitting approval request:', error)
              }
            }

            setSectionData((prev) => ({
              ...prev,
              [sectionId]: data,
            }));

            setSectionStatuses((prev) => {
              const updated: Record<string, SectionStatusEntry> = {
                ...prev,
                [sectionId]: {
                  ...prev[sectionId],
                  status: sectionNeedsApproval ? "PENDING_APPROVAL" : "COMPLETED",
                  lockedAt: new Date().toISOString(),
                  lockedBy: userId ?? prev[sectionId]?.lockedBy,
                },
              };

              return deriveParentStatuses(template.sections, updated);
            });

            getBatchRecordData();
          }
        } catch (error: any) {
          console.error(`Failed to save section ${sectionId}:`, error);

          const errorMessage =
            error.response?.data?.error || "Failed to save section";

          if (errorMessage.includes("completed and locked")) {
            const existingValues = sectionData[sectionId] ?? {};
            setSaveError(errorMessage);
            openApprovalDialog({
              sectionId,
              section: templateSection,
              currentValues: data,
              existingValues,
              parentSectionId,
            });
          } else if (errorMessage.includes("signature")) {
            // Signature validation failed, show error
            setSaveError("Invalid signature. Please try again.");
          } else {
            setSaveError(errorMessage);
          }
        }
      },
    });
    setShowSignatureDialog(true);
  };

  const validateRulesAgainstSection = (sectionId: string) => {
    const sectionDependencyRules = dependencyRules[sectionId] || []

    for (const rule of sectionDependencyRules) {
      const dependency = rule.ruleData?.sourceSectionId ?? rule.ruleData?.dependsOn;
      if (!dependency) continue;
      // console.log(`Validating dependency for section ${sectionId}: depends on ${dependency}`);

      const sourceStatus = sectionStatuses[dependency]?.status.toString().toUpperCase();
      const condition = rule.ruleData?.condition.toString().toUpperCase();

      // console.log(`Source section ${dependency} status: ${sourceStatus}, required condition: ${condition}`);
      let acceptable = true;

      if (condition === 'COMPLETED' && !(sourceStatus === 'PENDING_APPROVAL' || sourceStatus === 'APPROVED_FOR_CHANGE' || sourceStatus === 'COMPLETED' || sourceStatus === 'APPROVED')) {
        acceptable = false
      }//pending_approval should be treated as completed for dependency checks

      if (condition === 'APPROVED' && !(sourceStatus === 'APPROVED_FOR_CHANGE' || sourceStatus === 'APPROVED')) {
        acceptable = false
      }

      if (!sourceStatus || !acceptable) {
        return {
          ok: false,
          message: `${dependency} must be ${condition} before accessing ${sectionId}`
        }
      }
    }
    return { ok: true, message: "Okay to navigate to next section" }
  }

 const handleSectionSelect = (sectionId: string) => {
    setRuleError(null)
    const response = validateRulesAgainstSection(sectionId);
    if (!response.ok) {
      setRuleError(response.message);
      return
    }
    setActiveSectionId(sectionId);
    setShowVersionHistory(false); // Close history when switching sections
    setVersionViewData(null);
    setHistoryTargetSection(null);
  };

  const handleViewVersionData = (
    section: Section,
    versionId: string,
    versionData: any,
    approvalRequest?: VersionHistoryApprovalRequest | null
  ) => {
    const dataToShow = buildVersionHistoryPayload(versionData, approvalRequest);

    console.log(
      "Viewing version",
      versionId,
      "Section",
      section.title ?? section.id,
      dataToShow
    );
    const flattened = { [section.id]: cloneHistoryData(dataToShow) }

    setHistoryTargetSection(section)
    setVersionViewData(dataToShow)
    setVersionViewFlatData(flattened)
  }

  const handleCloseVersionHistory = () => {
    setShowVersionHistory(false);
    setVersionViewData(null);
    setVersionViewFlatData(null);
    setHistoryTargetSection(null);
  };

  useEffect(() => {
    const fetchActiveSectionSnapshot = async () => {
      if (!batchRecordId || !activeSectionId) {
        return;
      }

      const expectedVersion = sectionStatuses[activeSectionId]?.version;
      if (typeof expectedVersion !== "number") {
        return;
      }

      if (lastFetchedVersionsRef.current[activeSectionId] === expectedVersion) {
        return;
      }

      try {
        const token = await getToken();
        const response = await axios.get(
          `${serverPath}/api/batchRecordSections/${batchRecordId}/section/${activeSectionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: { _t: Date.now() },
          }
        );

        const sectionPayload = response.data?.sectionData ?? {};
        const flattened = flattenSectionSnapshot(activeSectionId, sectionPayload);

        setSectionData((prev) => ({
          ...prev,
          ...flattened,
        }));

        Object.entries(flattened).forEach(([id]) => {
          const version = sectionStatuses[id]?.version;
          if (typeof version === "number") {
            lastFetchedVersionsRef.current[id] = version;
          }
        });
      } catch (error) {
        console.error(
          `Failed to refresh section ${activeSectionId} data snapshot`,
          error
        );
      }
    };

    void fetchActiveSectionSnapshot();
  }, [
    activeSectionId,
    batchRecordId,
    flattenSectionSnapshot,
    getToken,
    sectionStatuses,
    serverPath,
  ]);

  const handleApprovalRequestSuccess = () => {
    const targetSectionId = approvalDialogState?.sectionId ?? activeSectionId;
    const parentSectionId = approvalDialogState?.parentSectionId;

    setSectionStatuses((prev) => {
      const updated: Record<string, SectionStatusEntry> = {
        ...prev,
        [targetSectionId]: {
          ...prev[targetSectionId],
          status: "PENDING_APPROVAL",
          lockedAt: prev[targetSectionId]?.lockedAt ?? new Date().toISOString(),
          lockedBy: prev[targetSectionId]?.lockedBy ?? user?.sub,
        },
      };

      if (parentSectionId) {
        const parentEntry = updated[parentSectionId] ?? {
          status: "DRAFT" as SectionStatus,
        };
        updated[parentSectionId] = {
          ...parentEntry,
          status: "PENDING_APPROVAL",
          lockedAt: parentEntry.lockedAt ?? new Date().toISOString(),
          lockedBy: parentEntry.lockedBy ?? user?.sub,
        };
      }
      return deriveParentStatuses(template.sections, updated);
    });
    setSaveError(null);
  };

  const handleCloseApprovalDialog = () => {
    setApprovalDialogState(null);
    setShowApprovalDialog(false);
  };

  const isSectionCompleted = (section: Section): boolean => {
    if (section.subsections && section.subsections.length > 0) {
      const parentStatus = sectionStatuses[section.id];
      if (
        parentStatus &&
        (parentStatus.status === "COMPLETED" ||
          parentStatus.status === "PENDING_APPROVAL")
      ) {
        return true;
      }

      return section.subsections.every((subsection) => {
        const status = sectionStatuses[subsection.id];
        return (
          status &&
          (status.status === "COMPLETED" ||
            status.status === "PENDING_APPROVAL")
        );
      });
    } else {
      const status = sectionStatuses[section.id];
      return (
        status &&
        (status.status === "COMPLETED" || status.status === "PENDING_APPROVAL")
      );
    }
  };

  const completedSections = new Set<string>(
    (template.sections || [])
      .filter((section: Section) => isSectionCompleted(section))
      .map((section: Section) => section.id)
  );

  const currentSection = template.sections?.find(
    (section: any) => section.id === activeSectionId
  );

  const sectionHistoryOptions = useMemo(() => {
    if (!currentSection) return []

    const result: Section[] = []
    const visit = (section: Section) => {
      const hasSubsections = Array.isArray(section.subsections) && section.subsections.length > 0

      if (!hasSubsections || (Array.isArray(section.fields) && section.fields.length > 0)) {
        result.push(section)
      }

      section.subsections?.forEach(visit)
    }

    visit(currentSection)
    return result
  }, [currentSection])

  const historySectionToRender = historyTargetSection ?? currentSection

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <FormSidebar
        sections={template.sections || []}
        activeSectionId={activeSectionId}
        completedSections={completedSections}
        onSectionSelect={handleSectionSelect}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        sectionStatuses={sectionStatuses}
      />

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">
              {batchRecordInfo.product
                ? batchRecordInfo.product.productName
                : "Batch Record"}
            </h1>
            <div className="mt-2 text-sm text-foreground">
              <p> Batch Record ID: {batchRecordInfo.id}</p>
              <p>
                {" "}
                Planned Quantity: {batchRecordInfo.plannedQuantity}
                {batchRecordInfo.unit}
              </p>
            </div>
            <p className="text-muted-foreground mt-2">
              Complete each section to build your batch record
            </p>
            {ruleError && (
              <div className="mb-4 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 font-medium"></span>
                  <div>
                    <div className="font-medium text-yellow-800">Section Access Restricted</div>
                    <div>
                      <p>{ruleError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {validationErrors && validationErrors.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-red-600 font-medium">❌</span>
                  <div>
                    <div className="font-medium text-red-800">Save Failed Due To Validation Error</div>
                    {validationErrors.map((err, idx) => (
                      <div key={idx} className="text-sm text-red-700">{idx}: {err}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {saveError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-red-600 font-medium">❌</span>
                  <div>
                    <div className="font-medium text-red-800">
                      Save Failed
                    </div>
                    <div className="text-sm text-red-700">{saveError}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Active section content */}
          {currentSection ? (
            <Card>
              <div>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span>{currentSection.title}</span>
                      {sectionStatuses[activeSectionId] && (
                      <SectionStatusIndicator
                        status={sectionStatuses[activeSectionId].status}
                        lockedAt={sectionStatuses[activeSectionId].lockedAt}
                        lockedBy={sectionStatuses[activeSectionId].lockedBy}
                        version={sectionStatuses[activeSectionId].version}
                      />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVersionHistory(!showVersionHistory)}
                      >
                        {showVersionHistory ? "Hide History" : "View History"}
                      </Button>
                      <span className="text-sm font-normal text-muted-foreground">
                        Section{" "}
                        {(template.sections?.findIndex(
                          (s: any) => s.id === activeSectionId
                        ) ?? 0) + 1}{" "}
                        of {template.sections?.length}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent >
                  <FormSectionRenderer
                    key={`${currentSection.id}-${sectionStatuses[activeSectionId]?.version ?? "0"}`}
                    section={currentSection}
                    onSelectionSave={handleSectionSave}
                    initialData={sectionData[activeSectionId] || {}}
                    sectionDataMap={sectionData}
                    readonly={
                      globalReadOnly || (
                        currentSection.subsections && currentSection.subsections.length > 0
                          ? ['COMPLETED', 'APPROVED'].includes(
                            (sectionStatuses[activeSectionId]?.status ?? '').toString().toUpperCase()
                          )
                          : ['COMPLETED', 'PENDING_APPROVAL', 'APPROVED'].includes(
                            (sectionStatuses[activeSectionId]?.status ?? '').toString().toUpperCase()
                          )
                      )
                    }
                    isHistory={false}
                    openApprovalDialog={openApprovalDialog}
                    sectionStatuses={sectionStatuses}
                    fieldValidationRules={validationRules || []}
                    sectionDependencyRules={dependencyRules || []}
                    allowEditRequests={!globalReadOnly}
                    allowSave={!globalReadOnly}
                  />
                </CardContent>
              </div>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Select a section from the sidebar to begin</p>
              </CardContent>
            </Card>
          )}

          {/* Version History Component */}
          <SectionVersionHistory
            batchRecordId={batchRecordId}
            sectionId={activeSectionId}
            isOpen={showVersionHistory}
            onClose={handleCloseVersionHistory}
            onViewVersion={handleViewVersionData}
            sectionOptions={sectionHistoryOptions}
          />

          {/* Version Data Viewer */}
          {
            versionViewData && historySectionToRender && (
              <Card className="mt-6 max-w-4xl">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      Viewing Historical Version Data
                      {historySectionToRender ? ` - ${historySectionToRender.title}` : ''}
                    </CardTitle>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setVersionViewData(null)
                        setHistoryTargetSection(null)
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {historySectionToRender && (
                    <FormSectionRenderer
                      key={`${historySectionToRender.id}-${JSON.stringify(versionViewData)}`}
                      section={historySectionToRender}
                      onSelectionSave={handleSectionSave}
                      initialData={versionViewData ?? {}}
                      readonly={true}
                      openApprovalDialog={openApprovalDialog}
                      isHistory={true}
                      sectionStatuses={sectionStatuses}
                      allowEditRequests={!globalReadOnly}
                      allowSave={false}
                      renderSubsections={false}
                      sectionDataMap={versionViewFlatData ?? undefined}
                    />
                  )}
                </CardContent>
              </Card>
            )
          }
        </div>


        {/* Approval Request Dialog */}
        <ApprovalRequestDialog
          batchRecordId={batchRecordId}
          sectionId={approvalDialogState?.sectionId ?? activeSectionId}
          sectionTitle={
            approvalDialogState?.section?.title ??
            currentSection?.title ??
            activeSectionId
          }
          isOpen={showApprovalDialog && approvalDialogState !== null}
          onClose={handleCloseApprovalDialog}
          sectionDefinition={approvalDialogState?.section ?? null}
          onSuccess={handleApprovalRequestSuccess}
          formValues={approvalDialogState?.currentValues ?? {}}
          existingValues={approvalDialogState?.existingValues ?? {}}
          parentSectionId={approvalDialogState?.parentSectionId}
        />

        {/* Electronic Signature Dialog */}
        {signatureDialogState && user?.sub && (
          <ElectronicSignatureDialog
            open={showSignatureDialog}
            onOpenChange={setShowSignatureDialog}
            userId={user.sub}
            entityType={signatureDialogState.entityType}
            entityId={signatureDialogState.entityId}
            canonicalPayload={signatureDialogState.canonicalPayload}
            batchRecordId={signatureDialogState.batchRecordId}
            sectionRecordId={signatureDialogState.sectionRecordId}
            onSigned={signatureDialogState.onSigned}
          />
        )}
      </div>
    </div>
  );
};

export default FormRenderer
