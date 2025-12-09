import React, { useState } from "react";
import type { ViewMode } from "./types";
import { useTemplateManager } from "./useTemplateManager";
import { useSectionManager } from "./useSectionManager";
import { useFieldManager } from "./useFieldManager";
import { exportTemplate } from "./utils";
import TemplateList from "./TemplateList";
import TemplateEditor from "./TemplateEditor";
import TemplatePreview from "./TemplatePreview";

const TemplateMaker: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    templates,
    currentTemplate,
    createNewTemplate,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    duplicateTemplate,
    loadSampleTemplateData,
    updateTemplate,
  } = useTemplateManager();

  const {
    expandedSections,
    expandedSubsections,
    setExpandedSections,
    setExpandedSubsections,
    toggleSection,
    toggleSubsection,
    addSection,
    updateSection,
    removeSection,
    addSubsection,
    updateSubsection,
    removeSubsection,
    setExpandedSectionsForTemplate,
    setExpandedSubsectionsForTemplate,
  } = useSectionManager(currentTemplate, updateTemplate);

  const {
    addField,
    updateField,
    removeField,
    addColumn,
    updateColumn,
    removeColumn,
  } = useFieldManager(currentTemplate, updateTemplate);

  const handleCreateNew = () => {
    createNewTemplate();
    setViewMode("editor");
    setExpandedSections(new Set());
    setExpandedSubsections(new Set());
  };

  const handleLoadTemplate = (template: any) => {
    if (template.id) {
      loadTemplate(template.id);
      setViewMode("editor");
      setExpandedSectionsForTemplate(template);
      setExpandedSubsectionsForTemplate([]);
    } else {
      console.error("Template ID is missing:", template);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const success = await deleteTemplate(templateId);
    if (success && currentTemplate.id === templateId) {
      setViewMode("list");
    }
  };

  const handleDuplicateTemplate = async (template: any) => {
    await duplicateTemplate(template);
  };

  const handleSaveTemplate = async () => {
    const success = await saveTemplate();
    if (success) {
      // Don't navigate away - stay in editor
    }
    // If save fails, stay in editor (don't navigate)
  };

  const handlePreviewTemplate = (template: any) => {
    if (template.id) {
      loadTemplate(template.id);
      setViewMode("preview");
    } else {
      console.error("Template ID is missing:", template);
    }
  };

  const handleLoadSampleTemplate = () => {
    const sampleTemplate = loadSampleTemplateData();
    setViewMode("editor");
    setExpandedSectionsForTemplate(sampleTemplate);
    setExpandedSubsectionsForTemplate(["dispensing", "mixing"]);
  };

  const handleExportTemplate = () => {
    exportTemplate(currentTemplate);
  };

  const handleBackToList = () => {
    setViewMode("list");
  };

  const handleEditTemplate = () => {
    setViewMode("editor");
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {viewMode === "list" && (
        <TemplateList
          templates={templates}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateNew={handleCreateNew}
          onLoadTemplate={handleLoadTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onDuplicateTemplate={handleDuplicateTemplate}
          onPreviewTemplate={handlePreviewTemplate}
          onLoadSampleTemplate={handleLoadSampleTemplate}
        />
      )}
      {viewMode === "editor" && (
        <TemplateEditor
          currentTemplate={currentTemplate}
          expandedSections={expandedSections}
          expandedSubsections={expandedSubsections}
          onBackToList={handleBackToList}
          onSaveTemplate={handleSaveTemplate}
          onUpdateTemplate={updateTemplate}
          onToggleSection={toggleSection}
          onToggleSubsection={toggleSubsection}
          onUpdateSection={updateSection}
          onRemoveSection={removeSection}
          onAddSubsection={addSubsection}
          onUpdateSubsection={updateSubsection}
          onRemoveSubsection={removeSubsection}
          onAddField={addField}
          onUpdateField={updateField}
          onRemoveField={removeField}
          onAddColumn={addColumn}
          onUpdateColumn={updateColumn}
          onRemoveColumn={removeColumn}
          onAddSection={addSection}
          onLoadSampleTemplate={handleLoadSampleTemplate}
          onExportTemplate={handleExportTemplate}
        />
      )}
      {viewMode === "preview" && (
        <TemplatePreview
          currentTemplate={currentTemplate}
          onBackToList={handleBackToList}
          onEditTemplate={handleEditTemplate}
        />
      )}
    </div>
  );
};

export default TemplateMaker;
