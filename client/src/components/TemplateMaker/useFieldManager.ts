import type { Field, Column, Template } from "./types";

export const useFieldManager = (
  currentTemplate: Template,
  updateTemplate: (updates: Partial<Template>) => void
) => {
  const addField = (sectionId: string, subsectionId?: string) => {
    const newField: Field = {
      id: `field-${Date.now()}`,
      name: "newField",
      label: "New Field",
      type: "text",
    };

    updateTemplate({
      sections: currentTemplate.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              ...(subsectionId
                ? {
                    subsections: section.subsections?.map((subsection) =>
                      subsection.id === subsectionId
                        ? {
                            ...subsection,
                            fields: [...subsection.fields, newField],
                          }
                        : subsection
                    ),
                  }
                : { fields: [...section.fields, newField] }),
            }
          : section
      ),
    });
  };

  const updateField = (
    sectionId: string,
    fieldId: string,
    updates: Partial<Field>,
    subsectionId?: string
  ) => {
    updateTemplate({
      sections: currentTemplate.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              ...(subsectionId
                ? {
                    subsections: section.subsections?.map((subsection) =>
                      subsection.id === subsectionId
                        ? {
                            ...subsection,
                            fields: subsection.fields.map((field) =>
                              field.id === fieldId
                                ? { ...field, ...updates }
                                : field
                            ),
                          }
                        : subsection
                    ),
                  }
                : {
                    fields: section.fields.map((field) =>
                      field.id === fieldId ? { ...field, ...updates } : field
                    ),
                  }),
            }
          : section
      ),
    });
  };

  const removeField = (
    sectionId: string,
    fieldId: string,
    subsectionId?: string
  ) => {
    updateTemplate({
      sections: currentTemplate.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              ...(subsectionId
                ? {
                    subsections: section.subsections?.map((subsection) =>
                      subsection.id === subsectionId
                        ? {
                            ...subsection,
                            fields: subsection.fields.filter(
                              (field) => field.id !== fieldId
                            ),
                          }
                        : subsection
                    ),
                  }
                : {
                    fields: section.fields.filter(
                      (field) => field.id !== fieldId
                    ),
                  }),
            }
          : section
      ),
    });
  };

  const addColumn = (
    sectionId: string,
    fieldId: string,
    subsectionId?: string
  ) => {
    const newColumn: Column = {
      id: `column-${Date.now()}`,
      label: "New Column",
      type: "text",
    };

    updateTemplate({
      sections: currentTemplate.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              ...(subsectionId
                ? {
                    subsections: section.subsections?.map((subsection) =>
                      subsection.id === subsectionId
                        ? {
                            ...subsection,
                            fields: subsection.fields.map((field) =>
                              field.id === fieldId
                                ? {
                                    ...field,
                                    columns: [
                                      ...(field.columns || []),
                                      newColumn,
                                    ],
                                  }
                                : field
                            ),
                          }
                        : subsection
                    ),
                  }
                : {
                    fields: section.fields.map((field) =>
                      field.id === fieldId
                        ? {
                            ...field,
                            columns: [...(field.columns || []), newColumn],
                          }
                        : field
                    ),
                  }),
            }
          : section
      ),
    });
  };

  const updateColumn = (
    sectionId: string,
    fieldId: string,
    columnId: string,
    updates: Partial<Column>,
    subsectionId?: string
  ) => {
    updateTemplate({
      sections: currentTemplate.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              ...(subsectionId
                ? {
                    subsections: section.subsections?.map((subsection) =>
                      subsection.id === subsectionId
                        ? {
                            ...subsection,
                            fields: subsection.fields.map((field) =>
                              field.id === fieldId
                                ? {
                                    ...field,
                                    columns: field.columns?.map((column) =>
                                      column.id === columnId
                                        ? { ...column, ...updates }
                                        : column
                                    ),
                                  }
                                : field
                            ),
                          }
                        : subsection
                    ),
                  }
                : {
                    fields: section.fields.map((field) =>
                      field.id === fieldId
                        ? {
                            ...field,
                            columns: field.columns?.map((column) =>
                              column.id === columnId
                                ? { ...column, ...updates }
                                : column
                            ),
                          }
                        : field
                    ),
                  }),
            }
          : section
      ),
    });
  };

  const removeColumn = (
    sectionId: string,
    fieldId: string,
    columnId: string,
    subsectionId?: string
  ) => {
    updateTemplate({
      sections: currentTemplate.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              ...(subsectionId
                ? {
                    subsections: section.subsections?.map((subsection) =>
                      subsection.id === subsectionId
                        ? {
                            ...subsection,
                            fields: subsection.fields.map((field) =>
                              field.id === fieldId
                                ? {
                                    ...field,
                                    columns: field.columns?.filter(
                                      (column) => column.id !== columnId
                                    ),
                                  }
                                : field
                            ),
                          }
                        : subsection
                    ),
                  }
                : {
                    fields: section.fields.map((field) =>
                      field.id === fieldId
                        ? {
                            ...field,
                            columns: field.columns?.filter(
                              (column) => column.id !== columnId
                            ),
                          }
                        : field
                    ),
                  }),
            }
          : section
      ),
    });
  };

  return {
    addField,
    updateField,
    removeField,
    addColumn,
    updateColumn,
    removeColumn,
  };
};
