export interface BaseField {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "range" | "duration" | "table" | "select" | "date";
  required?: boolean;
  validation?: string;
  spec?: string;
  method?: string;
  critical?: boolean;
  columns?: Column[]; // For table fields
  options?: string[]; // For select fields
}

export interface TextField extends BaseField {
  type: 'text';
}

export interface DateField extends BaseField {
  type: 'date'
}

export interface NumberField extends BaseField {
  type: 'number'
}

export interface TableField extends BaseField {
  type: 'table'
}

export interface SelectField extends BaseField {
  type: 'select'
}

export interface DurationField extends BaseField {
  type: 'duration'
}

export interface DateField extends BaseField {
  type: 'date'
}

export interface RangeField extends BaseField {
  type: 'range'
  min?: number
  max?: number
  stepSize?: number
}

export type Field = TextField | NumberField | TableField | DurationField | RangeField | SelectField | DateField;

export interface Column {
  id: string
  name: string
  label: string
  type: string
}

export interface Section {
  id: string;
  title: string;
  fields?: Field[]
  subsections?: Section[];
}

export interface SectionStatus {
  status: 'APPROVED_FOR_CHANGE' | 'COMPLETED' | 'PENDING_APPROVAL' | 'DRAFT';
  lockedAt?: string;
  lockedBy?: string;
}

export interface ApprovalDialogState {
  sectionId: string;
  section: Section;
  currentValues: Record<string, any>;
  existingValues: Record<string, any>;
  parentSectionId?: string | undefined;
}

export interface FormSchema {
  id: string;
  title: string;
  sections: Section[];
}
