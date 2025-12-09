import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Plus, Edit, Eye, FolderOpen, Trash2, FileText } from "lucide-react";
import type { Template } from "./types";
import { filterTemplates } from "./utils";

interface TemplateListProps {
  templates: Template[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCreateNew: () => void;
  onLoadTemplate: (template: Template) => void;
  onDeleteTemplate: (templateId: string) => void;
  onDuplicateTemplate: (template: Template) => void;
  onPreviewTemplate: (template: Template) => void;
  onLoadSampleTemplate: () => void;
}

const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  searchTerm,
  onSearchChange,
  onCreateNew,
  onLoadTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  onPreviewTemplate,
  onLoadSampleTemplate,
}) => {
  const filteredTemplates = filterTemplates(templates, searchTerm);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Batch Record Templates</h1>
          <p className="text-gray-600">
            Manage and create batch record templates
          </p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Template
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={onLoadSampleTemplate}>
          Load Sample Template
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? "No templates match your search criteria."
                  : "Get started by creating your first template."}
              </p>
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {template.title}
                      </h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {template.id}
                      </span>
                    </div>
                    {template.description && (
                      <p className="text-gray-600 mb-2">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {template.sections.length} section
                        {template.sections.length !== 1 ? "s" : ""}
                      </span>
                      {template.createdAt && (
                        <span>
                          Created:{" "}
                          {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                      )}
                      {template.updatedAt && (
                        <span>
                          Updated:{" "}
                          {new Date(template.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onLoadTemplate(template)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDuplicateTemplate(template)}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TemplateList;
