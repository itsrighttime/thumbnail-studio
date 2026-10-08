import type { CodeSettings, FieldKey, Mapping, ParsedTable, ThumbnailItem } from '../types';
import { generateCodes, type CodeRow } from './code';

export interface FieldDef {
  key: FieldKey;
  label: string;
  required: boolean;
  hint: string;
  placeholder: string;
  /** Normalised header names (lowercase, letters and digits only) that map to this field. */
  synonyms: string[];
  /** Whether a fixed default value makes sense for this field. */
  allowFixed: boolean;
}

export const FIELDS: FieldDef[] = [
  {
    key: 'domain',
    label: 'Domain',
    required: true,
    hint: 'Shown in the header and as the large faded text in the background.',
    placeholder: 'e.g. PostgreSQL',
    synonyms: ['domain', 'category', 'subject', 'area', 'technology', 'tech', 'stack', 'field'],
    allowFixed: true,
  },
  {
    key: 'type',
    label: 'Content type',
    required: false,
    hint: 'Theory, Practical, … Shown after the domain in the header.',
    placeholder: 'e.g. Theory',
    synonyms: ['type', 'contenttype', 'kind', 'contentkind', 'format', 'style'],
    allowFixed: true,
  },
  {
    key: 'title',
    label: 'Title',
    required: true,
    hint: 'The main headline, centred in the middle of the thumbnail.',
    placeholder: 'e.g. Why your database query is slow',
    synonyms: ['title', 'maintitle', 'headline', 'heading', 'videotitle', 'topic', 'name'],
    allowFixed: false,
  },
  {
    key: 'level',
    label: 'Level / part',
    required: false,
    hint: 'e.g. L1. Can be added to the header and used as {L} in the code pattern.',
    placeholder: 'e.g. L1',
    synonyms: ['level', 'lesson', 'part', 'series', 'episode', 'ep', 'module', 'lvl', 'chapter'],
    allowFixed: true,
  },
  {
    key: 'code',
    label: 'Code (override)',
    required: false,
    hint: 'If a row has a value here it is used as-is instead of the generated code.',
    placeholder: '',
    synonyms: ['code', 'sequencecode', 'seqcode', 'thumbnailcode', 'id', 'slug', 'serial'],
    allowFixed: false,
  },
];

export function emptyMapping(): Mapping {
  const blank = () => ({ column: null, fixed: '' });
  return {
    domain: blank(),
    type: blank(),
    title: blank(),
    level: blank(),
    code: blank(),
  };
}

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Picks a sensible column for every field by matching header names. */
export function autoMap(headers: string[]): Mapping {
  const mapping = emptyMapping();
  const normalised = headers.map(normalise);
  const used = new Set<number>();
  const order: FieldKey[] = ['title', 'domain', 'type', 'level', 'code'];

  for (const key of order) {
    const def = FIELDS.find((f) => f.key === key)!;
    let idx = -1;
    for (const syn of def.synonyms) {
      idx = normalised.findIndex((h, i) => !used.has(i) && h === syn);
      if (idx >= 0) break;
    }
    if (idx < 0) {
      for (const syn of def.synonyms) {
        if (syn.length < 4) continue;
        idx = normalised.findIndex((h, i) => !used.has(i) && h.includes(syn));
        if (idx >= 0) break;
      }
    }
    if (idx >= 0) {
      used.add(idx);
      mapping[key].column = headers[idx];
    }
  }
  return mapping;
}

/** Messages for anything required that is still missing. */
export function validateMapping(mapping: Mapping): string[] {
  const problems: string[] = [];
  for (const def of FIELDS) {
    if (!def.required) continue;
    const m = mapping[def.key];
    if (!m.column && !m.fixed.trim()) problems.push(`Choose a column for “${def.label}”.`);
  }
  return problems;
}

const sanitiseFileName = (s: string) =>
  s
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '-')
    .replace(/^[.\s]+|[.\s]+$/g, '');

/** Applies the mapping to every row and generates codes + unique file names. */
export function buildItems(
  table: ParsedTable,
  mapping: Mapping,
  codeSettings: CodeSettings,
): { items: ThumbnailItem[]; skipped: number } {
  const pick = (row: Record<string, string>, key: FieldKey): string => {
    const m = mapping[key];
    const value = m.column ? String(row[m.column] ?? '').trim() : '';
    if (key === 'code') return value;
    return (value || m.fixed.trim()).replace(/\s+/g, ' ');
  };

  const base: { domain: string; type: string; title: string; level: string; override: string }[] = [];
  let skipped = 0;
  for (const row of table.rows) {
    const title = pick(row, 'title');
    if (!title) {
      skipped++;
      continue;
    }
    base.push({
      domain: pick(row, 'domain'),
      type: pick(row, 'type'),
      title,
      level: pick(row, 'level'),
      override: pick(row, 'code'),
    });
  }

  const codeRows: CodeRow[] = base.map(({ domain, type, level, override }) => ({ domain, type, level, override }));
  const codes = generateCodes(codeRows, codeSettings);

  const used = new Map<string, number>();
  const unique = (name: string): string => {
    const key = name.toLowerCase();
    const n = used.get(key) ?? 0;
    used.set(key, n + 1);
    return n === 0 ? name : `${name}-${n + 1}`;
  };

  const items = base.map((b, i): ThumbnailItem => {
    const code = codes[i];
    const fallback = `thumbnail-${String(i + 1).padStart(3, '0')}`;
    return {
      index: i,
      domain: b.domain,
      type: b.type,
      title: b.title,
      level: b.level,
      code,
      fileBase: unique(sanitiseFileName(code) || fallback),
    };
  });

  return { items, skipped };
}
