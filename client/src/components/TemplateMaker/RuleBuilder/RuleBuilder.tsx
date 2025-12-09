import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Badge } from "../../ui/badge";
import { Settings } from "lucide-react";
import { SectionDependencyRuleBuilder } from "./SectionDependencyRuleBuilder";
import { FieldValidationRuleBuilder } from "./FieldValidationRuleBuilder";
import { ApprovalRequirementRuleBuilder } from "./ApprovalRequirementRuleBuilder";
import { RulePreview } from "./RulePreview";
import type { TemplateRule } from "../../../types/rules";

interface RuleBuilderProps {
  templateId: string;
  templateVersionId: string | null;
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
  loading?: boolean;
  error?: string | null;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  templateId,
  templateVersionId,
  sections,
  existingRules,
  onRuleCreated,
  onRuleDeleted,
  loading = false,
  error = null,
}) => {
  const [activeTab, setActiveTab] = useState("dependencies");
  const [previewRule, setPreviewRule] = useState<TemplateRule | null>(null);

  const ruleCounts = {
    dependencies: existingRules.filter(
      (r) => r.ruleType === "SECTION_DEPENDENCY"
    ).length,
    validations: existingRules.filter((r) => r.ruleType === "FIELD_VALIDATION")
      .length,
    approvals: existingRules.filter(
      (r) => r.ruleType === "APPROVAL_REQUIREMENT"
    ).length,
  };

  const handleRuleCreated = (rule: TemplateRule) => {
    onRuleCreated(rule);
    setPreviewRule(null);
  };

  const handlePreviewRule = (rule: TemplateRule) => {
    setPreviewRule(rule);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Template Rules
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Define rules to control how your template behaves and enforces
            validation.
          </p>
          {loading && <p className="text-sm text-blue-600">Loading rules...</p>}
          {error && <p className="text-sm text-red-600">Error: {error}</p>}
          <p className="text-sm text-gray-600">
            Found {existingRules.length} existing rules
          </p>
        </CardHeader>
        <CardContent>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="dependencies"
                className="flex items-center gap-2"
              >
                Dependencies
                <Badge variant="secondary" className="ml-1">
                  {ruleCounts.dependencies}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="validations"
                className="flex items-center gap-2"
              >
                Validations
                <Badge variant="secondary" className="ml-1">
                  {ruleCounts.validations}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="approvals"
                className="flex items-center gap-2"
              >
                Approvals
                <Badge variant="secondary" className="ml-1">
                  {ruleCounts.approvals}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dependencies" className="space-y-4">
              <SectionDependencyRuleBuilder
                templateId={templateId}
                sections={sections}
                existingRules={existingRules.filter(
                  (r) => r.ruleType === "SECTION_DEPENDENCY"
                )}
                onRuleCreated={handleRuleCreated}
                onRuleDeleted={onRuleDeleted}
                onPreviewRule={handlePreviewRule}
              />
            </TabsContent>

            <TabsContent value="validations" className="space-y-4">
              <FieldValidationRuleBuilder
                templateId={templateId}
                templateVersionId={templateVersionId}
                sections={sections}
                existingRules={existingRules.filter(
                  (r) => r.ruleType === "FIELD_VALIDATION"
                )}
                onRuleCreated={handleRuleCreated}
                onRuleDeleted={onRuleDeleted}
                onPreviewRule={handlePreviewRule}
              />
            </TabsContent>

            <TabsContent value="approvals" className="space-y-4">
              <ApprovalRequirementRuleBuilder
                templateId={templateId}
                sections={sections}
                existingRules={existingRules.filter(
                  (r) => r.ruleType === "APPROVAL_REQUIREMENT"
                )}
                onRuleCreated={handleRuleCreated}
                onRuleDeleted={onRuleDeleted}
                onPreviewRule={handlePreviewRule}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {previewRule && (
        <RulePreview
          rule={previewRule}
          sections={sections}
          onClose={() => setPreviewRule(null)}
        />
      )}
    </div>
  );
};
