import { useState, useEffect, useCallback } from 'react';
import { getTemplateWithRules } from '../services/templateApi';
import type { TemplateWithRules } from '../types/template';
import { useAuth0 } from "@auth0/auth0-react";

export interface UseTemplateWithRulesReturn {
  template: TemplateWithRules | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTemplateWithRules = (templateId: string | null): UseTemplateWithRulesReturn => {
  const { getAccessTokenSilently } = useAuth0();
  const [template, setTemplate] = useState<TemplateWithRules | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(() => getAccessTokenSilently({
    authorizationParams: {
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      scope: "openid profile email",
    }
  }), [getAccessTokenSilently]);

  const fetchTemplate = useCallback(async () => {
    if (!templateId) {
      setTemplate(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const templateData = await getTemplateWithRules(templateId, token);
      setTemplate(templateData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch template';
      setError(errorMessage);
      console.error('Error fetching template with rules:', err);
    } finally {
      setLoading(false);
    }
  }, [templateId, getToken]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  return {
    template,
    loading,
    error,
    refetch: fetchTemplate,
  };
};
