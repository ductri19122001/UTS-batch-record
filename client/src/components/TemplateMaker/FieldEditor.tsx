import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Trash2, GripVertical, Plus } from "lucide-react";
import type { Field } from "./types";
import { fieldTypes, columnTypes } from "./types";

interface FieldEditorProps {
  field: Field;
  sectionId: string;
  subsectionId?: string;
  onUpdateField: (
    sectionId: string,
    fieldId: string,
    updates: Partial<Field>,
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

const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  sectionId,
  subsectionId,
  onUpdateField,
  onRemoveField,
  onAddColumn,
  onUpdateColumn,
  onRemoveColumn,
}) => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-sm">Field: {field.label}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveField(sectionId, field.id, subsectionId)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Field Name</label>
            <Input
              value={field.name}
              onChange={(e) =>
                onUpdateField(
                  sectionId,
                  field.id,
                  { name: e.target.value },
                  subsectionId
                )
              }
              placeholder="fieldName"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Label</label>
            <Input
              value={field.label}
              onChange={(e) =>
                onUpdateField(
                  sectionId,
                  field.id,
                  { label: e.target.value },
                  subsectionId
                )
              }
              placeholder="Display Label"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              value={field.type}
              onChange={(e) =>
                onUpdateField(
                  sectionId,
                  field.id,
                  { type: e.target.value as Field["type"] },
                  subsectionId
                )
              }
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              {fieldTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={(e) =>
                onUpdateField(
                  sectionId,
                  field.id,
                  { required: e.target.checked },
                  subsectionId
                )
              }
              className="h-4 w-4"
            />
            <label className="text-sm font-medium">Required</label>
          </div>
        </div>

        {field.type === "range" && (
          <div>
            <label className="text-sm font-medium">Specification</label>
            <Input
              value={field.spec || ""}
              onChange={(e) =>
                onUpdateField(
                  sectionId,
                  field.id,
                  { spec: e.target.value },
                  subsectionId
                )
              }
              placeholder="e.g., 4.0-5.0"
            />
          </div>
        )}

        {field.type === "date" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Default Date</label>
              <Input
                type="date"
                value={field.default || ""}
                onChange={(e) =>
                  onUpdateField(
                    sectionId,
                    field.id,
                    { default: e.target.value },
                    subsectionId
                  )
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Date Format (optional)</label>
              <Input
                value={field.validation || ""}
                onChange={(e) =>
                  onUpdateField(
                    sectionId,
                    field.id,
                    { validation: e.target.value },
                    subsectionId
                  )
                }
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>
        )}

        {field.type === "select" && (
          <div>
            <label className="text-sm font-medium">
              Options (comma-separated)
            </label>
            <Input
              value={field.options?.join(", ") || ""}
              onChange={(e) =>
                onUpdateField(
                  sectionId,
                  field.id,
                  { options: e.target.value.split(",").map((s) => s.trim()) },
                  subsectionId
                )
              }
              placeholder="Option 1, Option 2, Option 3"
            />
          </div>
        )}

        {field.type === "table" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Table Columns</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddColumn(sectionId, field.id, subsectionId)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            </div>
            {field.columns?.map((column) => (
              <Card key={column.id} className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      Column: {column.label}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onRemoveColumn(sectionId, field.id, column.id, subsectionId)
                    }
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium">ID</label>
                    <Input
                      value={column.id}
                      onChange={(e) =>
                        onUpdateColumn(
                          sectionId,
                          field.id,
                          column.id,
                          { id: e.target.value },
                          subsectionId
                        )
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Label</label>
                    <Input
                      value={column.label}
                      onChange={(e) =>
                        onUpdateColumn(
                          sectionId,
                          field.id,
                          column.id,
                          { label: e.target.value },
                          subsectionId
                        )
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Type</label>
                    <select
                      value={column.type}
                      onChange={(e) =>
                        onUpdateColumn(
                          sectionId,
                          field.id,
                          column.id,
                          { type: e.target.value },
                          subsectionId
                        )
                      }
                      className="w-full h-7 rounded-md border border-input bg-transparent px-2 py-1 text-xs"
                    >
                      {columnTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Default Value</label>
            <Input
              value={field.default || ""}
              onChange={(e) =>
                onUpdateField(
                  sectionId,
                  field.id,
                  { default: e.target.value },
                  subsectionId
                )
              }
              placeholder="Default value"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Method</label>
            <Input
              value={field.method || ""}
              onChange={(e) =>
                onUpdateField(
                  sectionId,
                  field.id,
                  { method: e.target.value },
                  subsectionId
                )
              }
              placeholder="e.g., QC-T002"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={field.critical || false}
              onChange={(e) =>
                onUpdateField(
                  sectionId,
                  field.id,
                  { critical: e.target.checked },
                  subsectionId
                )
              }
              className="h-4 w-4"
            />
            <label className="text-sm font-medium">Critical</label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FieldEditor;
