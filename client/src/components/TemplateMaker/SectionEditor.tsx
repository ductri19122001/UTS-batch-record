import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Trash2, ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { Section } from "./types";
import FieldEditor from "./FieldEditor";

interface SectionEditorProps {
  section: Section;
  expandedSections: Set<string>;
  expandedSubsections: Set<string>;
  onToggleSection: (sectionId: string) => void;
  onToggleSubsection: (subsectionId: string) => void;
  onUpdateSection: (sectionId: string, updates: Partial<Section>) => void;
  onRemoveSection: (sectionId: string) => void;
  onAddSubsection: (sectionId: string) => void;
  onUpdateSubsection: (
    sectionId: string,
    subsectionId: string,
    updates: Partial<Section>
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
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  expandedSections,
  expandedSubsections,
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
}) => {
  const isExpanded = expandedSections.has(section.id);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSection(section.id)}
              className="flex items-center gap-2 hover:bg-gray-100 rounded p-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <CardTitle>Section: {section.title}</CardTitle>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddField(section.id)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddSubsection(section.id)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Subsection
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveSection(section.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="ml-6">
          <Input
            value={section.title}
            onChange={(e) =>
              onUpdateSection(section.id, { title: e.target.value })
            }
            placeholder="Section Title"
            className="max-w-xs"
          />
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {section.fields.map((field) => (
            <FieldEditor
              key={field.id}
              field={field}
              sectionId={section.id}
              onUpdateField={onUpdateField}
              onRemoveField={onRemoveField}
              onAddColumn={onAddColumn}
              onUpdateColumn={onUpdateColumn}
              onRemoveColumn={onRemoveColumn}
            />
          ))}
          {section.subsections?.map((subsection) => (
            <SubsectionEditor
              key={subsection.id}
              subsection={subsection}
              sectionId={section.id}
              expandedSubsections={expandedSubsections}
              onToggleSubsection={onToggleSubsection}
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
        </CardContent>
      )}
    </Card>
  );
};

interface SubsectionEditorProps {
  subsection: Section;
  sectionId: string;
  expandedSubsections: Set<string>;
  onToggleSubsection: (subsectionId: string) => void;
  onUpdateSubsection: (
    sectionId: string,
    subsectionId: string,
    updates: Partial<Section>
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
}

const SubsectionEditor: React.FC<SubsectionEditorProps> = ({
  subsection,
  sectionId,
  expandedSubsections,
  onToggleSubsection,
  onUpdateSubsection,
  onRemoveSubsection,
  onAddField,
  onUpdateField,
  onRemoveField,
  onAddColumn,
  onUpdateColumn,
  onRemoveColumn,
}) => {
  const isExpanded = expandedSubsections.has(subsection.id);

  return (
    <Card className="mb-4 ml-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSubsection(subsection.id)}
              className="flex items-center gap-2 hover:bg-gray-100 rounded p-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <CardTitle className="text-sm">
                Subsection: {subsection.title}
              </CardTitle>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddField(sectionId, subsection.id)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveSubsection(sectionId, subsection.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="ml-6">
          <Input
            value={subsection.title}
            onChange={(e) =>
              onUpdateSubsection(sectionId, subsection.id, {
                title: e.target.value,
              })
            }
            placeholder="Subsection Title"
            className="max-w-xs"
          />
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {subsection.fields.map((field) => (
            <FieldEditor
              key={field.id}
              field={field}
              sectionId={sectionId}
              subsectionId={subsection.id}
              onUpdateField={onUpdateField}
              onRemoveField={onRemoveField}
              onAddColumn={onAddColumn}
              onUpdateColumn={onUpdateColumn}
              onRemoveColumn={onRemoveColumn}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
};

export default SectionEditor;
