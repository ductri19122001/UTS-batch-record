import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { Plus, Eye, Trash2, CheckCircle } from "lucide-react";
import { createFieldValidationRule } from "../../../services/templateApi";
import type { TemplateRule } from "../../../types/rules";
import { useAuth0 } from "@auth0/auth0-react";

interface FieldValidationRuleBuilderProps {
  templateId: string;
  templateVersionId?: string | null;
  sections: Array<{
    id: string;
    title: string;
    fields: Array<{ id: string; label: string }>;
    sectionId?: string; // For subsections, track parent section ID
    isSubsection?: boolean;
  }>;
  existingRules: TemplateRule[];
  onRuleCreated: (rule: TemplateRule) => void;
  onRuleDeleted: (ruleId: string) => void;
  onPreviewRule: (rule: TemplateRule) => void;
}

export const FieldValidationRuleBuilder: React.FC<
  FieldValidationRuleBuilderProps
> = ({
  templateId,
  sections,
  existingRules,
  onRuleCreated,
  onRuleDeleted,
  onPreviewRule,
}) => {
    const { getAccessTokenSilently } = useAuth0();
    const [isCreating, setIsCreating] = useState(false);
    type ValidationType = "range" | "required" | "pattern";
    const [formData, setFormData] = useState({
      sectionId: "",
      fieldId: "",
      validationType: "required" as ValidationType,
      validationData: {} as any,
      message: "",
    });

    const [rangeData, setRangeData] = useState({ min: "", max: "" });
    const [patternData, setPatternData] = useState({ pattern: "", flags: "g" });
    const handleCreateRule = async () => {

      if (!formData.sectionId || !formData.fieldId || !formData.validationType) {
        alert("Please fill in all required fields");
        return;
      }

      let validationData = {};
      switch (formData.validationType) {
        case "range":
          if (!rangeData.min && !rangeData.max) {
            alert("Please provide at least one range value (min or max)");
            return;
          }
          validationData = {
            min: rangeData.min ? parseFloat(rangeData.min) : undefined,
            max: rangeData.max ? parseFloat(rangeData.max) : undefined,
          };
          break;
        case "pattern":
          if (!patternData.pattern) {
            alert("Please provide a regex pattern");
            return;
          }
          validationData = {
            pattern: patternData.pattern,
            flags: patternData.flags,
          };
          break;
        case "required":
          validationData = { required: true };
          break;
      }

      setIsCreating(true);
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            scope: "openid profile email",
          },
        });

        const rule = await createFieldValidationRule(
          templateId,
          {
            sectionId: formData.sectionId,
            fieldId: formData.fieldId,
            validationType: formData.validationType,
            validationData,
            message: formData.message || undefined,
          },
          token
        );

        onRuleCreated(rule);
        setFormData({
          sectionId: "",
          fieldId: "",
          validationType: "required",
          validationData: {},
          message: "",
        });
        setRangeData({ min: "", max: "" });
        setPatternData({ pattern: "", flags: "g" });
      } catch (error) {
        console.error("Error creating field validation rule:", error);
        alert("Failed to create rule");
      } finally {
        setIsCreating(false);
      }
    };

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
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return fieldId;
      const field = section.fields.find((f) => f.id === fieldId);
      return field ? field.label : fieldId;
    };

    const getRuleDescription = (rule: TemplateRule) => {
      const ruleData = rule.ruleData;
      const sectionTitle = getSectionTitle(rule.targetSectionId || "");
      const fieldTitle = getFieldTitle(
        rule.targetSectionId || "",
        rule.targetFieldId || ""
      );

      switch (ruleData.validationType) {
        case "required":
          return `${fieldTitle} in ${sectionTitle} is required`;
        case "range":
          const { min, max } = ruleData.validationData;
          if (min !== undefined && max !== undefined) {
            return `${fieldTitle} in ${sectionTitle} must be between ${min} and ${max}`;
          } else if (min !== undefined) {
            return `${fieldTitle} in ${sectionTitle} must be at least ${min}`;
          } else if (max !== undefined) {
            return `${fieldTitle} in ${sectionTitle} must be at most ${max}`;
          }
          return `${fieldTitle} in ${sectionTitle} has range validation`;
        case "pattern":
          return `${fieldTitle} in ${sectionTitle} must match pattern: ${ruleData.validationData.pattern}`;
        default:
          return `${fieldTitle} in ${sectionTitle} has validation`;
      }
    };

    const selectedSection = sections.find((s) => s.id === formData.sectionId);

    return (
      <div className="space-y-4">
        {/* Create New Rule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Field Validation Rule
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Define validation rules for specific fields in your template.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select
                  value={formData.sectionId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      sectionId: value,
                      fieldId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => {
                      // Display subsection with parent section indication
                      const displayTitle = section.isSubsection && section.sectionId
                        ? (() => {
                            const parentSection = sections.find((s) => s.id === section.sectionId);
                            return parentSection 
                              ? `${parentSection.title} > ${section.title}`
                              : section.title;
                          })()
                        : section.title;
                      
                      return (
                        <SelectItem key={section.id} value={section.id}>
                          {displayTitle}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="field">Field</Label>
                <Select
                  value={formData.fieldId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, fieldId: value }))
                  }
                  disabled={!selectedSection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSection?.fields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validationType">Validation Type</Label>
              <Select
                value={formData.validationType}
                onValueChange={(value: ValidationType) =>
                  setFormData((prev) => ({ ...prev, validationType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required">Required Field</SelectItem>
                  <SelectItem value="range">Numeric Range</SelectItem>
                  <SelectItem value="pattern">Regex Pattern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Validation Type Specific Fields */}
            {formData.validationType === "range" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minValue">Minimum Value</Label>
                  <Input
                    id="minValue"
                    type="number"
                    placeholder="e.g., 0"
                    value={rangeData.min}
                    onChange={(e) =>
                      setRangeData((prev) => ({ ...prev, min: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxValue">Maximum Value</Label>
                  <Input
                    id="maxValue"
                    type="number"
                    placeholder="e.g., 100"
                    value={rangeData.max}
                    onChange={(e) =>
                      setRangeData((prev) => ({ ...prev, max: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            {formData.validationType === "pattern" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pattern">Regex Pattern</Label>
                  <Input
                    id="pattern"
                    placeholder="e.g., ^[A-Za-z]+$"
                    value={patternData.pattern}
                    onChange={(e) =>
                      setPatternData((prev) => ({
                        ...prev,
                        pattern: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flags">Regex Flags</Label>
                  <Input
                    id="flags"
                    placeholder="e.g., gi"
                    value={patternData.flags}
                    onChange={(e) =>
                      setPatternData((prev) => ({
                        ...prev,
                        flags: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Enter a custom error message..."
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
              />
            </div>

            <Button
              onClick={handleCreateRule}
              disabled={
                isCreating ||
                !formData.sectionId ||
                !formData.fieldId
              }
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Rule"}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Rules */}
        {existingRules.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Existing Field Validations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{getRuleDescription(rule)}</p>
                        {rule.ruleData.message && (
                          <p className="text-sm text-muted-foreground">
                            {rule.ruleData.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPreviewRule(rule)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRuleDeleted(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };
