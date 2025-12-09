import { useState } from "react";
import type { Section, Template } from "./types";

export const useSectionManager = (
  currentTemplate: Template,
  updateTemplate: (updates: Partial<Template>) => void
) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleSubsection = (subsectionId: string) => {
    const newExpanded = new Set(expandedSubsections);
    if (newExpanded.has(subsectionId)) {
      newExpanded.delete(subsectionId);
    } else {
      newExpanded.add(subsectionId);
    }
    setExpandedSubsections(newExpanded);
  };

  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: "New Section",
      fields: [],
      subsections: [],
    };
    updateTemplate({
      sections: [...currentTemplate.sections, newSection],
    });
    setExpandedSections((prev) => new Set([...prev, newSection.id]));
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    updateTemplate({
      sections: currentTemplate.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              ...updates,
              fields: updates.fields || section.fields,
              subsections: updates.subsections || section.subsections,
            }
          : section
      ),
    });
  };

  const removeSection = (sectionId: string) => {
    updateTemplate({
      sections: currentTemplate.sections.filter((section) => section.id !== sectionId),
    });
  };

  const addSubsection = (sectionId: string) => {
    const newSubsection: Section = {
      id: `subsection-${Date.now()}`,
      title: "New Subsection",
      fields: [],
    };
    updateTemplate({
      sections: currentTemplate.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              subsections: [...(section.subsections || []), newSubsection],
            }
          : section
      ),
    });
    setExpandedSubsections((prev) => new Set([...prev, newSubsection.id]));
  };

  const updateSubsection = (
    sectionId: string,
    subsectionId: string,
    updates: Partial<Section>
  ) => {
    updateTemplate({
      sections: currentTemplate.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              subsections: section.subsections?.map((subsection) =>
                subsection.id === subsectionId
                  ? { ...subsection, ...updates }
                  : subsection
              ),
            }
          : section
      ),
    });
  };

  const removeSubsection = (sectionId: string, subsectionId: string) => {
    updateTemplate({
      sections: currentTemplate.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              subsections: section.subsections?.filter(
                (subsection) => subsection.id !== subsectionId
              ),
            }
          : section
      ),
    });
  };

  const setExpandedSectionsForTemplate = (template: Template) => {
    setExpandedSections(new Set(template.sections.map((s) => s.id)));
    setExpandedSubsections(new Set());
  };

  const setExpandedSubsectionsForTemplate = (subsectionIds: string[]) => {
    setExpandedSubsections(new Set(subsectionIds));
  };

  return {
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
  };
};
