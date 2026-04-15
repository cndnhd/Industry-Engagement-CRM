export type SortDir = 'asc' | 'desc' | null;

export type ColumnType = 'string' | 'number' | 'date' | 'lookup' | 'boolean';

export type FilterOperator =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'dateRange'
  | 'in';

export interface GridColumn<T> {
  key: string;
  header: string;
  type?: ColumnType;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  defaultVisible?: boolean;
  width?: string;
  render?: (item: T) => React.ReactNode;
  getValue?: (item: T) => string | number | null;
  filterOptions?: { value: string; label: string }[];
  aggregatable?: boolean;
  aggregateLabel?: string;
}

export interface ActiveFilter {
  key: string;
  operator: FilterOperator;
  value: string | string[] | [string, string];
}

export interface RollupDimension {
  key: string;
  label: string;
  getGroup: (item: unknown) => string;
}

export interface RollupAggregate {
  key: string;
  label: string;
  type: 'count' | 'sum' | 'average' | 'min' | 'max';
  getValue?: (item: unknown) => number;
}

export interface GridConfig<T> {
  columns: GridColumn<T>[];
  entityName: string;
  idField: string;
  searchableFields?: string[];
  rollupDimensions?: RollupDimension[];
  rollupAggregates?: RollupAggregate[];
  importMapping?: Record<string, string>;
  importRequiredFields?: string[];
  importDuplicateField?: string;
}
