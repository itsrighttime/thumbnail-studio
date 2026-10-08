import type { Align } from '../types';

export function fontString(weight: number, size: number, family: string): string {
  return `${weight} ${size}px "${family}", "Helvetica Neue", Arial, sans-serif`;
}

/** Width of `text` with `trackingPx` extra space between characters. */
export function measureTracked(ctx: CanvasRenderingContext2D, text: string, trackingPx: number): number {
  if (!trackingPx) return ctx.measureText(text).width;
  const chars = Array.from(text);
  let width = 0;
  for (const ch of chars) width += ctx.measureText(ch).width;
  return width + trackingPx * Math.max(0, chars.length - 1);
}

/** Largest font size (<= maxSize) at which `text` fits on one line of `maxWidth`. */
export function fitLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  weight: number,
  maxSize: number,
  minSize: number,
  maxWidth: number,
  trackingEm: number,
): number {
  for (let size = maxSize; size >= minSize; size--) {
    ctx.font = fontString(weight, size, family);
    if (measureTracked(ctx, text, trackingEm * size) <= maxWidth) return size;
  }
  return minSize;
}

/**
 * Draws one line so that its capital letters are centred on `cy`
 * (which looks centred for headers, codes and footers).
 */
export function drawLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  cy: number,
  align: Align,
  trackingPx: number,
): void {
  const capHeight = ctx.measureText('H').actualBoundingBoxAscent;
  const baseline = cy + capHeight / 2;

  if (!trackingPx) {
    ctx.textAlign = align;
    ctx.fillText(text, x, baseline);
    return;
  }

  const total = measureTracked(ctx, text, trackingPx);
  let cursor = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.textAlign = 'left';
  for (const ch of Array.from(text)) {
    ctx.fillText(ch, cursor, baseline);
    cursor += ctx.measureText(ch).width + trackingPx;
  }
}

function greedyWrap(ctx: CanvasRenderingContext2D, words: string[], width: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > width) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Wraps text into the fewest lines that fit `maxWidth`, then narrows the
 * width as far as possible without adding a line, so the lines come out
 * evenly balanced instead of one long line and one short one.
 */
export function balancedWrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const base = greedyWrap(ctx, words, maxWidth);
  if (base.length === 1) return base;

  let lo = Math.min(Math.max(...words.map((w) => ctx.measureText(w).width)), maxWidth);
  let hi = maxWidth;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (greedyWrap(ctx, words, mid).length <= base.length) hi = mid;
    else lo = mid;
  }
  return greedyWrap(ctx, words, hi);
}

export interface TitleFit {
  size: number;
  lines: string[];
}

/** Biggest title size whose wrapped text fits both the width and the height of its box. */
export function fitTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  weight: number,
  maxWidth: number,
  maxHeight: number,
  maxSize: number,
  minSize: number,
  lineHeight: number,
): TitleFit {
  for (let size = maxSize; size >= minSize; size -= 2) {
    ctx.font = fontString(weight, size, family);
    const lines = balancedWrap(ctx, text, maxWidth);
    const widest = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
    if (widest <= maxWidth + 0.5 && lines.length * size * lineHeight <= maxHeight) {
      return { size, lines };
    }
  }
  ctx.font = fontString(weight, minSize, family);
  return { size: minSize, lines: balancedWrap(ctx, text, maxWidth) };
}
