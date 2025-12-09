// Types for the template structure
export interface Field {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "range" | "duration" | "table" | "select" | "date";
  required?: boolean;
  default?: any;
  validation?: string;
  spec?: string;
  method?: string;
  critical?: boolean;
  columns?: Column[];
  options?: string[];
}

export interface Column {
  id: string;
  label: string;
  type: "text" | "number" | "select";
  required?: boolean;
  options?: string[];
}

export interface Section {
  id: string;
  title: string;
  fields: Field[];
  subsections?: Section[];
}

export interface Template {
  id: string;
  title: string;
  sections: Section[];
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  activeVersionId?: string | null;
}

export type ViewMode = "list" | "editor" | "preview";

// Field type options
export const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "range", label: "Range" },
  { value: "duration", label: "Duration" },
  { value: "table", label: "Table" },
  { value: "select", label: "Select" },
  { value: "date", label: "Date" },
];

// Column type options
export const columnTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
];
