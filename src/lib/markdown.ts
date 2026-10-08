const SEPARATOR = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/;

function isSeparator(line: string): boolean {
  return line.includes('-') && SEPARATOR.test(line.trim());
}

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  return s
    .split(/(?<!\\)\|/)
    .map((cell) =>
      cell
        .trim()
        .replace(/\\\|/g, '|')
        .replace(/^(\*\*|__)(.*)\1$/, '$2')
        .replace(/^`(.*)`$/, '$1'),
    );
}

/**
 * Finds the first GitHub-style markdown table in `text` and returns it as a
 * matrix (header row first). Returns null when the text has no table.
 */
export function parseMarkdownTable(text: string): string[][] | null {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].includes('|') || !isSeparator(lines[i + 1])) continue;
    const matrix: string[][] = [splitRow(lines[i])];
    for (let j = i + 2; j < lines.length; j++) {
      const line = lines[j];
      if (!line.trim() || !line.includes('|')) break;
      matrix.push(splitRow(line));
    }
    return matrix;
  }
  return null;
}
