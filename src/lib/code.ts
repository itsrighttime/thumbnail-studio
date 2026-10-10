import type { CodeSettings } from '../types';

export interface CodeRow {
  domain: string;
  type: string;
  level: string;
  /** A code supplied in the file; used as-is when present. */
  override: string;
}

/** "System Design" -> SD, "PostgreSQL" -> PSQL, "Docker" -> DOC. */
export function abbreviateDomain(domain: string): string {
  const words = domain.trim().split(/[\s/_-]+/).filter(Boolean);
  if (!words.length) return '';
  if (words.length > 1) {
    return words
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);
  }
  const word = words[0];
  const caps = word.match(/[A-Z0-9]/g) ?? [];
  if (caps.length >= 2 && caps.length <= 5) return caps.join('');
  return word.slice(0, 3).toUpperCase();
}

/** "Theory" -> TH, "Hands On" -> HO. */
export function abbreviateType(type: string): string {
  const words = type.trim().split(/[\s/_-]+/).filter(Boolean);
  if (!words.length) return '';
  if (words.length > 1) {
    return words
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
  }
  return words[0].slice(0, 2).toUpperCase();
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0');
}

function fill(pattern: string, row: CodeRow, s: CodeSettings, n: number, total: number, rowNo: number): string {
  const out = pattern.replace(/\{([A-Za-z]+)(?::(\d+))?\}/g, (match, name: string, width?: string) => {
    const explicit = width ? parseInt(width, 10) : undefined;
    // {N} / {TOTAL} follow the padding setting unless the pattern gives its own width ({N:3}).
    const w = explicit ?? s.padding;
    switch (name.toUpperCase()) {
      case 'P':
        return s.platform;
      case 'D':
        return abbreviateDomain(row.domain);
      case 'T':
        return abbreviateType(row.type);
      case 'L':
        return row.level.replace(/\s+/g, '');
      case 'N':
        return pad(n, w);
      case 'TOTAL':
        return pad(total, w);
      case 'ROW':
        return pad(rowNo, explicit ?? 0);
      default:
        return match;
    }
  });
  // Empty tokens (e.g. no level) would leave "--" behind.
  return out.replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '').trim();
}

/**
 * Sequence codes for every row, in order.
 *
 * Tokens: {P} platform, {D} domain initials, {T} type letters, {L} level,
 * {N} counter (start + step, zero-padded to the padding setting; {N:3} forces
 * 3 digits), {TOTAL} / {TOTAL:2} rows in the counter scope (same padding
 * rule), {ROW} position in the file.
 */
export function generateCodes(rows: CodeRow[], s: CodeSettings): string[] {
  const keyOf = (r: CodeRow): string => {
    if (s.scope === 'all') return 'all';
    const domain = r.domain.trim().toLowerCase();
    return s.scope === 'domain' ? domain : `${domain}|${r.level.trim().toLowerCase()}`;
  };

  const totals = new Map<string, number>();
  rows.forEach((r) => {
    if (r.override) return;
    const k = keyOf(r);
    totals.set(k, (totals.get(k) ?? 0) + 1);
  });

  const seen = new Map<string, number>();
  return rows.map((r, i) => {
    if (r.override) return r.override;
    const k = keyOf(r);
    const idx = seen.get(k) ?? 0;
    seen.set(k, idx + 1);
    return fill(s.pattern, r, s, s.start + idx * s.step, totals.get(k) ?? 0, i + 1);
  });
}
