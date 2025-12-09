import { useState, useEffect, useCallback } from 'react';
import { getTemplateRules, deleteTemplateRule } from '../services/templateApi';
import type { TemplateRule } from '../types/rules';
import { useAuth0 } from "@auth0/auth0-react";
interface UseTemplateRulesResult {
  rules: TemplateRule[];
  loading: boolean;
  error: string | null;
  refreshRules: () => Promise<void>;
  deleteRule: (ruleId: string) => Promise<void>;
}

export const useTemplateRules = (templateId: string | null): UseTemplateRulesResult => {
  const { getAccessTokenSilently } = useAuth0();

  const getToken = useCallback(() => getAccessTokenSilently({
    authorizationParams: {
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      scope: "openid profile email",
    }
  }), [getAccessTokenSilently]);

  const [rules, setRules] = useState<TemplateRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    if (!templateId) {
      setRules([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const fetchedRules = await getTemplateRules(templateId, token);
      setRules(fetchedRules);
    } catch (err) {
      console.error('Error fetching template rules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rules');
    } finally {
      setLoading(false);
    }
  }, [getToken, templateId]);

  const refreshRules = useCallback(async () => {
    await fetchRules();
  }, [fetchRules]);

  const deleteRule = async (ruleId: string) => {
    if (!templateId) return;

    try {
      const token = await getToken();
      await deleteTemplateRule(templateId, ruleId, token);
      // Remove the rule from local state
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    }
  };

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rules,
    loading,
    error,
    refreshRules,
    deleteRule,
  };
};
