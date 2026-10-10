export type FormatId = 'vertical' | 'horizontal';
export type Align = 'left' | 'center' | 'right';
export type TableSource = 'csv' | 'xlsx' | 'markdown';

/** Where everything sits on the canvas, in base (1x) pixels. */
export interface FormatLayout {
  header: { cy: number; maxSize: number; minSize: number; maxWidth: number; tracking: number };
  title: {
    top: number;
    bottom: number;
    maxWidth: number;
    maxSize: number;
    minSize: number;
    lineHeight: number;
  };
  handle: { x: number; cy: number; size: number; maxWidth: number; align: Align };
  channel: { x: number; cy: number; size: number; maxWidth: number; align: Align };
  code: {
    x: number;
    cy: number;
    maxSize: number;
    minSize: number;
    maxWidth: number;
    tracking: number;
    align: Align;
  };
  /** Large faded background text built from the domain. */
  backdrop: { rows: number; maxWidthFrac: number; gap: number };
}

export interface FormatSpec {
  id: FormatId;
  label: string;
  sub: string;
  width: number;
  height: number;
  /** Export multipliers offered in the UI (1 = base size). */
  scales: number[];
  defaultScale: number;
  platformCode: string;
  showLevelDefault: boolean;
  defaultPattern: string;
  defaultPadding: number;
  layout: FormatLayout;
}

export type FieldKey = 'domain' | 'type' | 'title' | 'level' | 'code';

export interface FieldMapping {
  /** Column header in the uploaded file, or null when not mapped. */
  column: string | null;
  /** Used for every row when no column is mapped, and for rows where the cell is empty. */
  fixed: string;
}

export type Mapping = Record<FieldKey, FieldMapping>;

export interface ParsedTable {
  headers: string[];
  rows: Record<string, string>[];
  source: TableSource;
  sheetNames?: string[];
  sheet?: string;
}

export interface Brand {
  handle: string;
  channel: string;
  bg: string;
  showLevelInHeader: boolean;
}

export type CodeScope = 'all' | 'domain' | 'domainLevel';

export interface CodeSettings {
  pattern: string;
  platform: string;
  start: number;
  step: number;
  /** Zero-padding width (digits) for {N} and {TOTAL}; 0 = no padding. {N:3} overrides it. */
  padding: number;
  scope: CodeScope;
}

export interface ExportOptions {
  scale: number;
  type: 'png' | 'jpeg';
}

export interface ThumbnailItem {
  index: number;
  domain: string;
  type: string;
  title: string;
  level: string;
  code: string;
  /** File name without extension, unique within the batch. */
  fileBase: string;
}

export type RenderInput = Pick<ThumbnailItem, 'domain' | 'type' | 'title' | 'level' | 'code'>;
