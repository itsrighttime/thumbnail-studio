function splitRow(row: string): [string, string] {
  const mid = Math.floor(row.length / 2);

  // Prefer splitting at a space nearest the middle.
  const spaces: number[] = [];
  for (let i = 1; i < row.length - 1; i++) if (row[i] === ' ') spaces.push(i);
  if (spaces.length) {
    const at = spaces.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
    return [row.slice(0, at), row.slice(at + 1)];
  }

  // Otherwise a camelCase boundary near the middle (PostgreSQL -> Postgre / SQL).
  const humps: number[] = [];
  for (let i = 1; i < row.length; i++) {
    if (/[a-z0-9]/.test(row[i - 1]) && /[A-Z]/.test(row[i])) humps.push(i);
  }
  const near = humps.filter((i) => Math.abs(i - mid) <= Math.ceil(row.length * 0.3));
  const at = near.length ? near.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a)) : mid;
  return [row.slice(0, at), row.slice(at)];
}

/**
 * Splits the domain into `target` rows of big background text.
 * "Software Engineer" -> Soft / ware / Engi / neer (4 rows) or
 * Software / Engineer (2 rows).
 */
export function buildBackdropRows(domain: string, target: number): string[] {
  const rows = domain.trim().split(/\s+/).filter(Boolean);
  if (!rows.length) return [];

  // Too many words: merge the shortest neighbouring pair.
  while (rows.length > target) {
    let best = 0;
    let bestLen = Infinity;
    for (let i = 0; i < rows.length - 1; i++) {
      const len = rows[i].length + rows[i + 1].length;
      if (len < bestLen) {
        bestLen = len;
        best = i;
      }
    }
    rows.splice(best, 2, `${rows[best]} ${rows[best + 1]}`);
  }

  // Too few: split the longest row until we reach the target.
  while (rows.length < target) {
    let li = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].length > rows[li].length) li = i;
    if (rows[li].length < 5) break;
    const [a, b] = splitRow(rows[li]);
    rows.splice(li, 1, a, b);
  }
  return rows;
}
