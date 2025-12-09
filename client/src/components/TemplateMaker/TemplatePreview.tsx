import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Edit, Loader2 } from "lucide-react";
import type { Template, Section, Field } from "./types";
import { useTemplateWithRules } from "../../hooks/useTemplateWithRules";

interface TemplatePreviewProps {
  currentTemplate: Template;
  onBackToList: () => void;
  onEditTemplate: () => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  currentTemplate,
  onBackToList,
  onEditTemplate,
}) => {
  // Only fetch from API if the template has a valid database ID (not a sample template)
  const isSampleTemplate =
    currentTemplate.id?.startsWith("sample-") || !currentTemplate.id;
  const {
    template: templateWithRules,
    loading,
    error,
  } = useTemplateWithRules(
    isSampleTemplate ? null : currentTemplate.id || null
  );

  // Use templateWithRules if available, otherwise fall back to currentTemplate
  const displayTemplate = templateWithRules || currentTemplate;
  const sections: Section[] = Array.isArray(templateWithRules?.data?.sections)
    ? (templateWithRules?.data?.sections as Section[])
    : currentTemplate.sections;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading template...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Template Preview</h1>
            <p className="text-gray-600">{currentTemplate.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onBackToList}>
              Back to List
            </Button>
            <Button variant="outline" onClick={onEditTemplate}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-600">Error loading template: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Template Preview</h1>
          <p className="text-gray-600">{displayTemplate.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBackToList}>
            Back to List
          </Button>
          <Button variant="outline" onClick={onEditTemplate}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Template
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Template ID
              </label>
              <p className="text-sm">{displayTemplate.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Title</label>
              <p className="text-sm">{displayTemplate.title}</p>
            </div>
          </div>
          {displayTemplate.description && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Description
              </label>
              <p className="text-sm">{displayTemplate.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Display Rules if available */}
      {templateWithRules && (
        <Card>
          <CardHeader>
            <CardTitle>Template Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">
                  Section Rules ({templateWithRules.sectionRules.length})
                </h4>
                {templateWithRules.sectionRules.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {templateWithRules.sectionRules.map((rule) => (
                      <li key={rule.id} className="text-gray-600">
                        {rule.ruleType}: {rule.targetSectionId}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No section rules defined
                  </p>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-2">
                  Field Rules ({templateWithRules.fieldRules.length})
                </h4>
                {templateWithRules.fieldRules.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {templateWithRules.fieldRules.map((rule) => (
                      <li key={rule.id} className="text-gray-600">
                        {rule.ruleType}: {rule.targetFieldId}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No field rules defined
                  </p>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-2">
                  Business Rules ({templateWithRules.businessRules.length})
                </h4>
                {templateWithRules.businessRules.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {templateWithRules.businessRules.map((rule) => (
                      <li key={rule.id} className="text-gray-600">
                        {rule.ruleType}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No business rules defined
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {sections.length > 0 ? (
          sections.map((section: Section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {section.fields && section.fields.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Fields:</h4>
                    <div className="space-y-2">
                      {section.fields.map((field: Field) => (
                        <div
                          key={field.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="font-medium">{field.label}:</span>
                          <span className="text-gray-600">{field.type}</span>
                          {field.required && (
                            <span className="text-red-600 text-xs">
                              Required
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {section.subsections && section.subsections.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Subsections:</h4>
                    <div className="space-y-2">
                      {section.subsections.map((subsection: Section) => (
                        <div key={subsection.id} className="ml-4">
                          <h5 className="font-medium text-sm">
                            {subsection.title}
                          </h5>
                          <div className="space-y-1">
                            {subsection.fields?.map((field: Field) => (
                              <div
                                key={field.id}
                                className="flex items-center gap-2 text-sm ml-4"
                              >
                                <span className="font-medium">
                                  {field.label}:
                                </span>
                                <span className="text-gray-600">
                                  {field.type}
                                </span>
                                {field.required && (
                                  <span className="text-red-600 text-xs">
                                    Required
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-gray-500 text-center">
                No sections defined for this template
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TemplatePreview;
