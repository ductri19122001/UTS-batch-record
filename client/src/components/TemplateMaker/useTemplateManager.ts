import { useState, useEffect, useCallback } from "react";
import type { Template } from "./types";
import type { Template as ApiTemplate } from "../../types/template";
import {
  createTemplate,
  getAllTemplates,
  updateTemplate as updateTemplateAPI,
  deleteTemplate as deleteTemplateAPI,
  getTemplateById
} from "../../services/templateApi";
import { loadSampleTemplate } from "./utils";
import { useAuth0 } from '@auth0/auth0-react';

export const useTemplateManager = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const userId = user?.sub;

  const getToken = useCallback(() => getAccessTokenSilently({
    authorizationParams: {
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      scope: "openid profile email",
    }
  }), [getAccessTokenSilently]);

  const transformTemplate = (apiTemplate: ApiTemplate): Template => ({
    id: apiTemplate.id,
    title: apiTemplate.title,
    description: apiTemplate.description,
    sections: apiTemplate.activeVersion?.data?.sections || [],
    createdAt: apiTemplate.createdAt,
    updatedAt: apiTemplate.updatedAt,
    activeVersionId: apiTemplate.activeVersion?.id ?? null,
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<Template>({
    id: "",
    title: "",
    sections: [],
    activeVersionId: null,
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const apiTemplates = await getAllTemplates(token);
      // Transform API templates to match our local Template interface
      const transformedTemplates: Template[] = apiTemplates.map(transformTemplate);
      setTemplates(transformedTemplates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMessage);
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Load templates from API on component mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const createNewTemplate = () => {
    const newTemplate: Template = {
      id: "",
      title: "",
      sections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: "",
      activeVersionId: null,
    };
    setCurrentTemplate(newTemplate);
    return newTemplate;
  };

  const saveTemplate = async (): Promise<boolean> => {
    // Debug logging to understand template structure

    // Enhanced validation with better error handling
    if (!currentTemplate || typeof currentTemplate !== 'object') {
      console.error("Template data is invalid:", currentTemplate);
      alert("Template data is invalid");
      return false;
    }

    // Ensure template has required properties
    if (!currentTemplate.hasOwnProperty('title')) {
      console.error("Template missing title property:", currentTemplate);
      alert("Template is missing required properties. Please refresh and try again.");
      return false;
    }

    // Additional debugging for the specific issue

    if (!currentTemplate.title || currentTemplate.title.trim() === "") {
      console.error("Title validation failed:", currentTemplate.title);
      alert("Please provide a Template Title");
      return false;
    }

    if (!currentTemplate.description || currentTemplate.description.trim() === "") {
      console.error("Description validation failed:", currentTemplate.description);
      alert("Please provide a Template Description");
      return false;
    }

    // Check if template has a custom ID (not auto-generated or sample)
    if (!currentTemplate.id || currentTemplate.id.trim() === "" || currentTemplate.id.startsWith('sample-')) {
      console.error("ID validation failed:", currentTemplate.id);
      alert("Please provide a Template ID. This will be used to identify your template.");
      return false;
    }

    // Check if sections exist and have content
    if (!currentTemplate.sections || currentTemplate.sections.length === 0) {
      alert("Please add at least one section to the template");
      return false;
    }

    // Additional validation: check if sections have meaningful content
    const hasValidSections = currentTemplate.sections.some(section =>
      section.fields && section.fields.length > 0
    );

    if (!hasValidSections) {
      alert("Please add at least one field to a section");
      return false;
    }


    setLoading(true);
    setError(null);

    try {
      // Check if template already exists in database
      const existingTemplate = templates.find(t => t.id === currentTemplate.id);
      const token = await getToken();

      if (existingTemplate) {
        // Update existing template
        await updateTemplateAPI(currentTemplate.id, {
          title: currentTemplate.title.trim(),
          description: currentTemplate.description.trim(),
          data: { sections: currentTemplate.sections },
          userId: userId,
        }, token);

        const refreshedApiTemplate = await getTemplateById(currentTemplate.id, token);
        const transformedTemplate = transformTemplate(refreshedApiTemplate);

        setTemplates((prev) => {
          const existingIndex = prev.findIndex((t) => t.id === currentTemplate.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = transformedTemplate;
            return updated;
          }
          return prev;
        });

        setCurrentTemplate(transformedTemplate);
      } else {
        // Create new template with user's custom ID
        await createTemplate({
          id: currentTemplate.id, // Pass user's custom ID
          title: currentTemplate.title.trim(),
          description: currentTemplate.description.trim(),
          data: { sections: currentTemplate.sections },
          createdBy: userId, // Default to logged-in user
        }, token);

        const refreshedApiTemplate = await getTemplateById(currentTemplate.id, token);
        const transformedTemplate = transformTemplate(refreshedApiTemplate);

        setTemplates((prev) => {
          const filtered = prev.filter((t) => t.id !== transformedTemplate.id);
          return [...filtered, transformedTemplate];
        });
        setCurrentTemplate(transformedTemplate);
      }

      alert("Template saved successfully!");
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template';
      setError(errorMessage);
      alert(`Failed to save template: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (templateId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const apiTemplate: ApiTemplate = await getTemplateById(templateId, token);
      const template = transformTemplate(apiTemplate);
      setCurrentTemplate(template);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load template';
      setError(errorMessage);
      console.error('Error loading template:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplateFromAPI = async (templateId: string): Promise<boolean> => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      // Use the imported deleteTemplateAPI function from the API service
      await deleteTemplateAPI(templateId, token);

      // Remove from local state
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));

      // Clear current template if it was the deleted one
      if (currentTemplate.id === templateId) {
        setCurrentTemplate({ id: "", title: "", sections: [], activeVersionId: null, description: "" });
      }

      alert("Template deleted successfully!");
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      setError(errorMessage);
      alert(`Failed to delete template: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const duplicateTemplate = async (template: Template): Promise<Template | null> => {
    setLoading(true);
    setError(null);

    try {
      const duplicatedTemplate: Template = {
        ...template,
        id: "", // Will be assigned by the API
        title: `${template.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const token = await getToken();
      const newApiTemplate = await createTemplate({
        title: duplicatedTemplate.title,
        description: duplicatedTemplate.description || "",
        data: { sections: duplicatedTemplate.sections },
        createdBy: userId
      }, token);

      const refreshedApiTemplate = await getTemplateById(newApiTemplate.id, token);
      const finalTemplate = transformTemplate(refreshedApiTemplate);

      setTemplates((prev) => [...prev, finalTemplate]);
      setCurrentTemplate(finalTemplate);

      alert("Template duplicated successfully!");
      return finalTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate template';
      setError(errorMessage);
      alert(`Failed to duplicate template: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadSampleTemplateData = () => {
    const sampleTemplate = {
      ...loadSampleTemplate(),
      activeVersionId: null,
    };
    setCurrentTemplate(sampleTemplate);
    return sampleTemplate;
  };

  const updateTemplate = (updates: Partial<Template>) => {
    setCurrentTemplate((prev) => {
      const updated = { ...prev, ...updates };
      return updated;
    });
  };

  // Export the delete function
  const deleteTemplate = deleteTemplateFromAPI;

  return {
    templates,
    currentTemplate,
    loading,
    error,
    createNewTemplate,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    duplicateTemplate,
    loadSampleTemplateData,
    updateTemplate,
    loadTemplates, // Expose for manual refresh
  };
};
