import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { X, ArrowRight, CheckCircle, Shield, Info } from "lucide-react";
import type { TemplateRule } from "../../../types/rules";

interface RulePreviewProps {
  rule: TemplateRule;
  sections: Array<{
    id: string;
    title: string;
    fields: Array<{ id: string; label: string }>;
    sectionId?: string; // For subsections, track parent section ID
    isSubsection?: boolean;
  }>;
  onClose: () => void;
}

export const RulePreview: React.FC<RulePreviewProps> = ({
  rule,
  sections,
  onClose,
}) => {
  const getSectionTitle = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return sectionId;
    
    // If it's a subsection, show "Parent Section > Subsection"
    if (section.isSubsection && section.sectionId) {
      const parentSection = sections.find((s) => s.id === section.sectionId);
      if (parentSection) {
        return `${parentSection.title} > ${section.title}`;
      }
    }
    
    return section.title;
  };

  const getFieldTitle = (sectionId: string, fieldId: string) => {
    let section = sections.find((s) => s.id === sectionId);

    if (!section) {
      section = sections.find((s) => {
        if (s.isSubsection && s.id.includes(":")) {
          const parts = s.id.split(":");
          return parts.length === 2 && parts[1] === sectionId;
        }
        return false;
      });
    }

    if (!section) return fieldId;
    const field = section.fields.find((f) => f.id === fieldId);
    return field ? field.label : fieldId;
  };

  const formatMessage = (message: string): string => {
    if (!message) return message;

    let formattedMessage = message;

    const sortedSections = [...sections].sort(
      (a, b) => b.id.length - a.id.length
    );

    for (const section of sortedSections) {
      const escapedId = section.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedId, "g");
      formattedMessage = formattedMessage.replace(regex, section.title);
    }

    return formattedMessage;
  };

  const getRuleIcon = (ruleType: string) => {
    switch (ruleType) {
      case "SECTION_DEPENDENCY":
        return <ArrowRight className="h-5 w-5 text-blue-600" />;
      case "FIELD_VALIDATION":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "APPROVAL_REQUIREMENT":
        return <Shield className="h-5 w-5 text-purple-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRuleTypeLabel = (ruleType: string) => {
    switch (ruleType) {
      case "SECTION_DEPENDENCY":
        return "Section Dependency";
      case "FIELD_VALIDATION":
        return "Field Validation";
      case "APPROVAL_REQUIREMENT":
        return "Approval Requirement";
      default:
        return ruleType;
    }
  };

  const getRuleTypeColor = (ruleType: string) => {
    switch (ruleType) {
      case "SECTION_DEPENDENCY":
        return "bg-blue-100 text-blue-800";
      case "FIELD_VALIDATION":
        return "bg-green-100 text-green-800";
      case "APPROVAL_REQUIREMENT":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderRuleDetails = () => {
    const ruleData = rule.ruleData;

    switch (rule.ruleType) {
      case "SECTION_DEPENDENCY":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Source Section:</span>
              <Badge variant="outline">
                {getSectionTitle(ruleData.sourceSectionId)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Target Section:</span>
              <Badge variant="outline">
                {getSectionTitle(ruleData.targetSectionId)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Condition:</span>
              <Badge variant="secondary">
                {ruleData.condition === "completed"
                  ? "Must be completed"
                  : "Must be approved"}
              </Badge>
            </div>
            {ruleData.message && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Message:</strong> {formatMessage(ruleData.message)}
                </p>
              </div>
            )}
          </div>
        );

      case "FIELD_VALIDATION":
        const sectionTitle = getSectionTitle(rule.targetSectionId || "");
        const fieldTitle = getFieldTitle(
          rule.targetSectionId || "",
          rule.targetFieldId || ""
        );

        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Section:</span>
              <Badge variant="outline">{sectionTitle}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Field:</span>
              <Badge variant="outline">{fieldTitle}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Validation Type:</span>
              <Badge variant="secondary">{ruleData.validationType}</Badge>
            </div>

            {ruleData.validationType === "range" && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Range:</strong>{" "}
                  {ruleData.validationData.min !== undefined &&
                  ruleData.validationData.max !== undefined
                    ? `${ruleData.validationData.min} - ${ruleData.validationData.max}`
                    : ruleData.validationData.min !== undefined
                      ? `≥ ${ruleData.validationData.min}`
                      : `≤ ${ruleData.validationData.max}`}
                </p>
              </div>
            )}

            {ruleData.validationType === "pattern" && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Pattern:</strong> {ruleData.validationData.pattern}
                </p>
                {ruleData.validationData.flags && (
                  <p className="text-sm text-green-800">
                    <strong>Flags:</strong> {ruleData.validationData.flags}
                  </p>
                )}
              </div>
            )}

            {ruleData.message && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Error Message:</strong> {ruleData.message}
                </p>
              </div>
            )}
          </div>
        );

      case "APPROVAL_REQUIREMENT":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Section:</span>
              <Badge variant="outline">
                {getSectionTitle(rule.targetSectionId || "")}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Required Role:</span>
              <Badge variant="secondary">{ruleData.requiredRole}</Badge>
            </div>
            {ruleData.message && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Message:</strong> {ruleData.message}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-800">
              <strong>Rule Data:</strong> {JSON.stringify(ruleData, null, 2)}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getRuleIcon(rule.ruleType)}
              <div>
                <CardTitle className="text-lg">Rule Preview</CardTitle>
                <Badge className={getRuleTypeColor(rule.ruleType)}>
                  {getRuleTypeLabel(rule.ruleType)}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderRuleDetails()}

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Rule ID: {rule.id}</span>
              <span>
                Created: {new Date(rule.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
