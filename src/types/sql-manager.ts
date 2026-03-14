export type SqlManagerFieldInput =
  | "text"
  | "textarea"
  | "number"
  | "decimal"
  | "boolean"
  | "select"
  | "datetime"
  | "json"
  | "string-array"
  | "password";

export interface SqlManagerFieldOption {
  label: string;
  value: string;
}

export interface SqlManagerFieldMeta {
  name: string;
  label: string;
  type: string;
  input: SqlManagerFieldInput;
  required: boolean;
  readOnly: boolean;
  hasDefaultValue: boolean;
  isList: boolean;
  isJson: boolean;
  options?: SqlManagerFieldOption[];
  helperText?: string;
}

export interface SqlManagerModelMeta {
  name: string;
  label: string;
  description: string;
  primaryField: string;
  fields: SqlManagerFieldMeta[];
  tableColumns: string[];
}

export interface SqlManagerModelOverview extends SqlManagerModelMeta {
  count: number;
}

export interface SqlManagerRecordListResponse {
  items: Record<string, unknown>[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
