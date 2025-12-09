import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { Plus, Eye, Trash2, Shield } from "lucide-react";
import { createApprovalRequirementRule } from "../../../services/templateApi";
import type { TemplateRule } from "../../../types/rules";
import { useAuth0 } from "@auth0/auth0-react";

interface ApprovalRequirementRuleBuilderProps {
  templateId: string;
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

const AVAILABLE_ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "supervisor", label: "Supervisor" },
  { value: "qa", label: "Quality Assurance" },
  { value: "qc", label: "Quality Control" },
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director" },
];

export const ApprovalRequirementRuleBuilder: React.FC<
  ApprovalRequirementRuleBuilderProps
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
    const [formData, setFormData] = useState({
      sectionId: "",
      requiredRole: "",
      message: "",
    });

    const handleCreateRule = async () => {
      if (!formData.sectionId || !formData.requiredRole) {
        alert("Please select both section and required role");
        return;
      }

      setIsCreating(true);
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            scope: "openid profile email",
          },
        });

        const rule = await createApprovalRequirementRule(
          templateId,
          {
            sectionId: formData.sectionId,
            requiredRole: formData.requiredRole,
            message: formData.message || undefined,
          },
          token
        );

        onRuleCreated(rule);
        setFormData({
          sectionId: "",
          requiredRole: "",
          message: "",
        });
      } catch (error) {
        console.error("Error creating approval requirement rule:", error);
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

    const getRoleLabel = (roleValue: string) => {
      const role = AVAILABLE_ROLES.find((r) => r.value === roleValue);
      return role ? role.label : roleValue;
    };

    const getRuleDescription = (rule: TemplateRule) => {
      const ruleData = rule.ruleData;
      const sectionTitle = getSectionTitle(rule.targetSectionId || "");
      const roleLabel = getRoleLabel(ruleData.requiredRole);
      return `${sectionTitle} requires ${roleLabel} approval`;
    };

    return (
      <div className="space-y-4">
        {/* Create New Rule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Approval Requirement Rule
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Define which sections require approval from specific roles before
              they can be completed.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select
                  value={formData.sectionId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, sectionId: value }))
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
                <Label htmlFor="requiredRole">Required Role</Label>
                <Select
                  value={formData.requiredRole}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, requiredRole: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select required role" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Enter a custom message for this approval requirement..."
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">
                    How Approval Rules Work
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    When a user completes a section with an approval requirement,
                    the section will be marked as "Pending Approval" and the
                    specified role will be notified to review and approve the
                    section before it can be considered complete.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateRule}
              disabled={
                isCreating ||
                !formData.sectionId ||
                !formData.requiredRole
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
              <CardTitle>Existing Approval Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-muted-foreground" />
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
