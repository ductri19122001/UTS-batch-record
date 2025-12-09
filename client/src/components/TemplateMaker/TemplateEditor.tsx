import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Plus, Save, Settings, FileText, Shield } from "lucide-react";
import type { Template } from "./types";
import SectionEditor from "./SectionEditor";
import { RuleBuilder } from "./RuleBuilder";
import { useTemplateRules } from "../../hooks/useTemplateRules";
import STARTING_MATERIALS_SECTION from "../../lib/startingMaterialsSection.json";

interface TemplateEditorProps {
  currentTemplate: Template;
  expandedSections: Set<string>;
  expandedSubsections: Set<string>;
  onBackToList: () => void;
  onSaveTemplate: () => void;
  onUpdateTemplate: (updates: Partial<Template>) => void;
  onToggleSection: (sectionId: string) => void;
  onToggleSubsection: (subsectionId: string) => void;
  onUpdateSection: (sectionId: string, updates: any) => void;
  onRemoveSection: (sectionId: string) => void;
  onAddSubsection: (sectionId: string) => void;
  onUpdateSubsection: (
    sectionId: string,
    subsectionId: string,
    updates: any
  ) => void;
  onRemoveSubsection: (sectionId: string, subsectionId: string) => void;
  onAddField: (sectionId: string, subsectionId?: string) => void;
  onUpdateField: (
    sectionId: string,
    fieldId: string,
    updates: any,
    subsectionId?: string
  ) => void;
  onRemoveField: (
    sectionId: string,
    fieldId: string,
    subsectionId?: string
  ) => void;
  onAddColumn: (
    sectionId: string,
    fieldId: string,
    subsectionId?: string
  ) => void;
  onUpdateColumn: (
    sectionId: string,
    fieldId: string,
    columnId: string,
    updates: any,
    subsectionId?: string
  ) => void;
  onRemoveColumn: (
    sectionId: string,
    fieldId: string,
    columnId: string,
    subsectionId?: string
  ) => void;
  onAddSection: () => void;
  onLoadSampleTemplate: () => void;
  onExportTemplate: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  currentTemplate,
  expandedSections,
  expandedSubsections,
  onBackToList,
  onSaveTemplate,
  onUpdateTemplate,
  onToggleSection,
  onToggleSubsection,
  onUpdateSection,
  onRemoveSection,
  onAddSubsection,
  onUpdateSubsection,
  onRemoveSubsection,
  onAddField,
  onUpdateField,
  onRemoveField,
  onAddColumn,
  onUpdateColumn,
  onRemoveColumn,
  onAddSection,
  onLoadSampleTemplate,
  onExportTemplate,
}) => {
  const [activeTab, setActiveTab] = useState("structure");


  // Use the template rules hook
  const templateIdForRules =
    currentTemplate.id && !currentTemplate.id.startsWith("sample-")
      ? currentTemplate.id
      : null;

  const {
    rules,
    loading: rulesLoading,
    error: rulesError,
    refreshRules,
    deleteRule,
  } = useTemplateRules(templateIdForRules);

  const onAddStartingMaterials = () => {
    const startingPreset = JSON.parse(JSON.stringify(STARTING_MATERIALS_SECTION));
    onUpdateTemplate({ sections: [...(currentTemplate.sections || []), startingPreset] });
  }

  // Convert template sections to the format expected by RuleBuilder
  // Flatten sections and subsections so both appear in the dropdown
  const sectionsForRules: Array<{
    id: string;
    title: string;
    fields: Array<{ id: string; label: string }>;
    sectionId?: string;
    isSubsection?: boolean;
  }> = [];

  currentTemplate.sections?.forEach((section) => {
    // Add the main section
    sectionsForRules.push({
      id: section.id,
      title: section.title,
      fields:
        section.fields?.map((field) => ({
          id: field.id,
          label: field.label || field.name || field.id,
        })) || [],
      isSubsection: false,
    });

    // Add subsections if they exist
    if (section.subsections && section.subsections.length > 0) {
      section.subsections.forEach((subsection) => {
        sectionsForRules.push({
          id: subsection.id,
          title: subsection.title,
          fields:
            subsection.fields?.map((field) => ({
              id: field.id,
              label: field.label || field.name || field.id,
            })) || [],
          sectionId: section.id,
          isSubsection: true,
        });
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Template Editor</h1>
          <p className="text-gray-600">
            {currentTemplate.id
              ? `Editing: ${currentTemplate.title}`
              : "Create a new template"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBackToList}>
            Back to List
          </Button>
          <Button onClick={onSaveTemplate}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Template Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Template ID</label>
              <Input
                value={currentTemplate.id}
                onChange={(e) => onUpdateTemplate({ id: e.target.value })}
                placeholder="e.g., powder-blend-v1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Template Title</label>
              <Input
                value={currentTemplate.title}
                onChange={(e) => onUpdateTemplate({ title: e.target.value })}
                placeholder="e.g., Powder Blend"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={currentTemplate.description || ""}
              onChange={(e) =>
                onUpdateTemplate({ description: e.target.value })
              }
              placeholder="Template description..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Template Structure and Rules */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Template Structure
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Rules & Validation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-6">
          {/* Sections */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4 mt-4">
              <h2 className="text-xl font-semibold">Sections</h2>
              <div className="flex gap-5">
                <Button onClick={onAddSection}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
                <Button onClick={onAddStartingMaterials}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Starting Materials
                </Button>
              </div>
            </div>
            {currentTemplate.sections.map((section) => (
              <SectionEditor
                key={section.id}
                section={section}
                expandedSections={expandedSections}
                expandedSubsections={expandedSubsections}
                onToggleSection={onToggleSection}
                onToggleSubsection={onToggleSubsection}
                onUpdateSection={onUpdateSection}
                onRemoveSection={onRemoveSection}
                onAddSubsection={onAddSubsection}
                onUpdateSubsection={onUpdateSubsection}
                onRemoveSubsection={onRemoveSubsection}
                onAddField={onAddField}
                onUpdateField={onUpdateField}
                onRemoveField={onRemoveField}
                onAddColumn={onAddColumn}
                onUpdateColumn={onUpdateColumn}
                onRemoveColumn={onRemoveColumn}
              />
            ))}
          </div>

          {/* Export */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onLoadSampleTemplate}>
              Load Sample Template
            </Button>
            <Button variant="outline" onClick={() => { }}>
              <Settings className="h-4 w-4 mr-2" />
              Preview JSON
            </Button>
            <Button onClick={onExportTemplate}>Export Template</Button>
          </div>

          {/* JSON Preview */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Template JSON Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(currentTemplate, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          {currentTemplate.id && !currentTemplate.id.startsWith("sample-") ? (
            <RuleBuilder
              templateId={currentTemplate.id}
              templateVersionId={currentTemplate.activeVersionId ?? null}
              sections={sectionsForRules}
              existingRules={rules}
              loading={rulesLoading}
              error={rulesError}
              onRuleCreated={async () => {
                await refreshRules(); // Refresh the rules list
              }}
              onRuleDeleted={async (ruleId) => {
                await deleteRule(ruleId); // Delete the rule
                await refreshRules();
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Save Template First
                </h3>
                <p className="text-gray-600">
                  Please save your template with a custom ID before adding
                  rules.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TemplateEditor;
