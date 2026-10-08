import type { ParsedTable, TableSource } from '../types';

/** Turns a raw grid of cells (first non-empty row = headers) into a ParsedTable. */
export function matrixToTable(
  matrix: unknown[][],
  source: TableSource,
  extra?: { sheetNames?: string[]; sheet?: string },
): ParsedTable {
  const cleaned: string[][] = matrix.map((row) => row.map((cell) => String(cell ?? '').trim()));
  const headerIdx = cleaned.findIndex((row) => row.some((cell) => cell !== ''));
  if (headerIdx < 0) throw new Error('This file looks empty.');

  const rawHeaders = cleaned[headerIdx];
  let last = rawHeaders.length;
  while (last > 0 && rawHeaders[last - 1] === '') last--;

  const seen = new Map<string, number>();
  const headers = rawHeaders.slice(0, last).map((h, i) => {
    const name = h || `Column ${i + 1}`;
    const key = name.toLowerCase();
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    return n ? `${name} (${n + 1})` : name;
  });
  if (!headers.length) throw new Error('Could not find a header row.');

  const rows = cleaned
    .slice(headerIdx + 1)
    .filter((row) => row.some((cell) => cell !== ''))
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((h, i) => {
        record[h] = row[i] ?? '';
      });
      return record;
    });
  if (!rows.length) throw new Error('No data rows found below the header row.');

  return { headers, rows, source, ...extra };
}
