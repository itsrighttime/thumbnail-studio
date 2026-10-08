import { THEME } from '../theme';
import type { Brand, FormatLayout, FormatSpec, RenderInput } from '../types';
import { buildBackdropRows } from './backdrop';
import { drawLine, fitLine, fitTitle, fontString } from './text';

export interface RenderOptions {
  format: FormatSpec;
  brand: Brand;
  /** Pixel multiplier: 1 = base size, 2 = double resolution. */
  scale: number;
}

const F = THEME.fonts;

/** Makes sure every font used by the design is loaded before drawing. */
export async function ensureFonts(sampleText: string): Promise<void> {
  const faces: [number, string][] = [
    [F.headerWeight, F.header],
    [F.titleWeight, F.title],
    [F.backdropWeight, F.backdrop],
    [F.handleWeight, F.handle],
    [F.channelWeight, F.channel],
    [F.codeWeight, F.code],
  ];
  await Promise.all(faces.map(([weight, family]) => document.fonts.load(`${weight} 40px "${family}"`, sampleText)));
}

function drawBackdrop(ctx: CanvasRenderingContext2D, rows: string[], W: number, H: number, cfg: FormatLayout['backdrop']) {
  if (!rows.length) return;
  const maxWidth = W * cfg.maxWidthFrac;

  let size = 700;
  let capHeight = 0;
  for (; size > 40; size -= 4) {
    ctx.font = fontString(F.backdropWeight, size, F.backdrop);
    capHeight = ctx.measureText('H').actualBoundingBoxAscent;
    const widest = Math.max(...rows.map((r) => ctx.measureText(r).width));
    const totalHeight = (rows.length - 1) * capHeight * cfg.gap + capHeight;
    if (widest <= maxWidth && totalHeight <= H * 0.9) break;
  }

  ctx.font = fontString(F.backdropWeight, size, F.backdrop);
  capHeight = ctx.measureText('H').actualBoundingBoxAscent;
  ctx.fillStyle = THEME.backdrop;
  ctx.textAlign = 'center';
  rows.forEach((row, i) => {
    const cy = H / 2 + (i - (rows.length - 1) / 2) * capHeight * cfg.gap;
    ctx.fillText(row, W / 2, cy + capHeight / 2);
  });
}

/** Draws one thumbnail. Fonts must already be loaded (see renderToCanvas). */
export function drawThumbnail(ctx: CanvasRenderingContext2D, input: RenderInput, o: RenderOptions): void {
  const { format, brand, scale } = o;
  const { width: W, height: H, layout: L } = format;

  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  (ctx as unknown as { textRendering: string }).textRendering = 'geometricPrecision';
  ctx.textBaseline = 'alphabetic';

  // Background and faded domain text
  ctx.fillStyle = brand.bg;
  ctx.fillRect(0, 0, W, H);
  drawBackdrop(ctx, buildBackdropRows(input.domain, L.backdrop.rows), W, H, L.backdrop);

  // Header: "Domain | Type - Level"
  const headerText =
    [input.domain, input.type].filter(Boolean).join(' | ') +
    (brand.showLevelInHeader && input.level ? ` - ${input.level}` : '');
  if (headerText) {
    const h = L.header;
    const size = fitLine(ctx, headerText, F.header, F.headerWeight, h.maxSize, h.minSize, h.maxWidth, h.tracking);
    ctx.font = fontString(F.headerWeight, size, F.header);
    ctx.fillStyle = THEME.text;
    drawLine(ctx, headerText, W / 2, h.cy, 'center', h.tracking * size);
  }

  // Title: auto-sized and centred in the space between header and footer
  if (input.title) {
    const t = L.title;
    const availableHeight = t.bottom - t.top;
    const fit = fitTitle(ctx, input.title, F.title, F.titleWeight, t.maxWidth, availableHeight, t.maxSize, t.minSize, t.lineHeight);
    ctx.font = fontString(F.titleWeight, fit.size, F.title);
    ctx.fillStyle = THEME.text;
    ctx.textAlign = 'center';
    const capHeight = ctx.measureText('H').actualBoundingBoxAscent;
    const lineStep = fit.size * t.lineHeight;
    const blockTop = t.top + (availableHeight - fit.lines.length * lineStep) / 2;
    fit.lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, blockTop + i * lineStep + lineStep / 2 + capHeight / 2);
    });
  }

  // Footer: handle, channel name, code
  if (brand.handle) {
    const c = L.handle;
    const size = fitLine(ctx, brand.handle, F.handle, F.handleWeight, c.size, 14, c.maxWidth, 0);
    ctx.font = fontString(F.handleWeight, size, F.handle);
    ctx.fillStyle = THEME.textSoft;
    drawLine(ctx, brand.handle, c.x, c.cy, c.align, 0);
  }
  if (brand.channel) {
    const c = L.channel;
    const size = fitLine(ctx, brand.channel, F.channel, F.channelWeight, c.size, 14, c.maxWidth, 0);
    ctx.font = fontString(F.channelWeight, size, F.channel);
    ctx.fillStyle = THEME.text;
    drawLine(ctx, brand.channel, c.x, c.cy, c.align, 0);
  }
  if (input.code) {
    const c = L.code;
    const size = fitLine(ctx, input.code, F.code, F.codeWeight, c.maxSize, c.minSize, c.maxWidth, c.tracking);
    ctx.font = fontString(F.codeWeight, size, F.code);
    ctx.fillStyle = THEME.text;
    drawLine(ctx, input.code, c.x, c.cy, c.align, c.tracking * size);
  }

  ctx.restore();
}

export async function renderToCanvas(input: RenderInput, o: RenderOptions): Promise<HTMLCanvasElement> {
  await ensureFonts(
    [input.domain, input.type, input.title, input.level, input.code, o.brand.handle, o.brand.channel].join(' '),
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(o.format.width * o.scale);
  canvas.height = Math.round(o.format.height * o.scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  drawThumbnail(ctx, input, o);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: 'image/png' | 'image/jpeg', quality = 0.95): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not export the image.'))), type, quality);
  });
}
