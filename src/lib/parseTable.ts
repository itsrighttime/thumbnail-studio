import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ParsedTable } from '../types';
import { parseMarkdownTable } from './markdown';
import { matrixToTable } from './matrix';

const SPREADSHEET_EXT = ['xlsx', 'xlsm', 'xlsb', 'xls', 'ods'];

/** CSV / TSV or a markdown table, from pasted or loaded text. */
export function parseText(text: string): ParsedTable {
  const clean = text.replace(/^﻿/, '');
  if (!clean.trim()) throw new Error('Nothing to read yet.');

  const markdown = parseMarkdownTable(clean);
  if (markdown) return matrixToTable(markdown, 'markdown');

  const result = Papa.parse<string[]>(clean, { skipEmptyLines: 'greedy' });
  return matrixToTable(result.data, 'csv');
}

export function parseWorkbook(buffer: ArrayBuffer, sheet?: string): ParsedTable {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  if (!sheetNames.length) throw new Error('This workbook has no sheets.');
  const name = sheet && sheetNames.includes(sheet) ? sheet : sheetNames[0];
  const matrix = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[name], {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
  });
  return matrixToTable(matrix, 'xlsx', { sheetNames, sheet: name });
}

export async function parseFile(file: File, sheet?: string): Promise<ParsedTable> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (SPREADSHEET_EXT.includes(ext)) {
    return parseWorkbook(await file.arrayBuffer(), sheet);
  }
  return parseText(await file.text());
}
