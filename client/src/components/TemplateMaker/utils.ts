import type { Template } from "./types";

// Sample template data
export const loadSampleTemplate = (): Template => ({
  id: "sample-template-v1",
  title: "Power Blend",
  description: "Sample template for powder blend manufacturing",
  sections: [
    {
      id: "materials",
      title: "Starting Materials",
      fields: [
        {
          id: "material",
          name: "material",
          label: "Material",
          type: "table",
          columns: [
            { id: "description", label: "Description", type: "text" },
            { id: "itemCode", label: "Item Code", type: "text" },
            { id: "lotNo", label: "Lot No.", type: "text" },
            {
              id: "composition",
              label: "% of Composition",
              type: "number",
            },
            { id: "tareWt", label: "Tare Wt", type: "number" },
            { id: "actualWt", label: "Actual Wt", type: "number" },
            { id: "grossWt", label: "Gross Wt", type: "number" },
          ],
        },
      ],
    },
    {
      id: "processSteps",
      title: "Production Procedure",
      fields: [],
      subsections: [
        {
          id: "dispensing",
          title: "Dispensing",
          fields: [
            {
              id: "location",
              name: "location",
              label: "Location",
              type: "text",
            },
            {
              id: "temperature",
              name: "temperature",
              label: "Temperature",
              type: "number",
              validation: "< 25°C",
            },
            {
              id: "humidity",
              name: "humidity",
              label: "Humidity",
              type: "number",
              validation: "< 60%",
            },
          ],
        },
        {
          id: "mixing",
          title: "Mixing",
          fields: [
            {
              id: "mixTime",
              name: "mixTime",
              label: "Mix Time",
              type: "duration",
              default: 20,
            },
          ],
        },
      ],
    },
    {
      id: "qualityControl",
      title: "In-Process Quality Control",
      fields: [
        {
          id: "appearance",
          name: "appearance",
          label: "Appearance",
          spec: "Off white powder with tiny red specks",
          type: "text",
        },
        {
          id: "pH",
          name: "pH",
          label: "pH",
          spec: "4.0-5.0",
          type: "range",
          method: "QC-T002",
        },
        {
          id: "moisture",
          name: "moisture",
          label: "Moisture",
          spec: "≤5%",
          type: "number",
          method: "QC-T003",
        },
        {
          id: "waterActivity",
          name: "waterActivity",
          label: "Water Activity",
          spec: "≤0.60aw",
          type: "number",
          method: "QC-T005",
        },
        {
          id: "bulkDensity",
          name: "bulkDensity",
          label: "Bulk Density",
          spec: "0.7-1.0",
          type: "range",
          method: "QC-T001",
        },
      ],
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Export template as JSON file
export const exportTemplate = (template: Template) => {
  const templateJson = JSON.stringify(template, null, 2);
  const blob = new Blob([templateJson], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${template.id || "template"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Filter templates based on search term
export const filterTemplates = (templates: Template[], searchTerm: string): Template[] => {
  return templates.filter(
    (template) =>
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description &&
        template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
};
