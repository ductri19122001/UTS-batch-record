import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { X, FileText, Calendar } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

interface Template {
  id: string;
  title: string;
  description?: string;
  sections?: any[];
  activeVersionId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (template: Template) => void;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onTemplateSelect,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAccessTokenSilently } = useAuth0();

  const getToken = async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: "openid profile email",
      }
    })
    return token;
  }

  // Fetch templates from API
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();

      const serverPath = import.meta.env.VITE_API_SERVER_URL as string;
      const response = await axios.get(`${serverPath}/api/templates`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const templatesData = response.data;

      if (!templatesData || templatesData.length === 0) {
        setTemplates([]);
        return;
      }

      // Transform API data to match the expected format
      const transformedTemplates = templatesData.map((template: any) => {
        const sections =
          template.activeVersion?.data?.sections ||
          template.data?.sections ||
          [];

        return {
          id: template.id,
          title: template.title,
          description: template.description,
          sections: sections,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
          templateId: template.id,
          templateVersionId: template.activeVersion?.id,
          activeVersionId: template.activeVersion?.id ?? null,
        };
      });

      setTemplates(transformedTemplates);
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to fetch templates from server");
    } finally {
      setLoading(false);
    }
  };

  // Fetch templates when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect(template);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">
            Select Template for New Batch Record
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 p-8">
          <div className="text-gray-600 mb-6">
            Choose a template to create your new batch record. Each template
            includes predefined sections and fields tailored for specific
            manufacturing processes.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">Loading templates...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-red-500">
                  <p>Error: {error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchTemplates}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">No templates available</div>
              </div>
            ) : (
              templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-800">
                            {template.title}
                          </CardTitle>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {template.createdAt
                                  ? new Date(
                                      template.createdAt
                                    ).toLocaleDateString()
                                  : "Recently created"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-gray-600 text-sm mb-4">
                      {template.description}
                    </p>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">
                        Sections ({template.sections?.length || 0}):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.sections?.slice(0, 3).map((section: any) => (
                          <span
                            key={section.id}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                          >
                            {section.title}
                          </span>
                        ))}
                        {template.sections && template.sections.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                            +{template.sections.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateSelect(template);
                        }}
                      >
                        Use This Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateSelectionModal;
