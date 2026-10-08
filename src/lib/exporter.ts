import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import Papa from 'papaparse';
import type { Brand, ExportOptions, FormatSpec, ThumbnailItem } from '../types';
import { canvasToBlob, renderToCanvas } from './renderThumbnail';

const MIME = { png: 'image/png', jpeg: 'image/jpeg' } as const;
const EXT = { png: 'png', jpeg: 'jpg' } as const;

export const fileExt = (type: ExportOptions['type']) => EXT[type];

async function renderBlob(item: ThumbnailItem, format: FormatSpec, brand: Brand, opts: ExportOptions): Promise<Blob> {
  const canvas = await renderToCanvas(item, { format, brand, scale: opts.scale });
  return canvasToBlob(canvas, MIME[opts.type], 0.95);
}

export async function exportSingle(item: ThumbnailItem, format: FormatSpec, brand: Brand, opts: ExportOptions): Promise<void> {
  const blob = await renderBlob(item, format, brand, opts);
  saveAs(blob, `${item.fileBase}.${EXT[opts.type]}`);
}

/** Renders every thumbnail at export quality and downloads them as one zip (plus a manifest.csv). */
export async function exportZip(
  items: ThumbnailItem[],
  format: FormatSpec,
  brand: Brand,
  opts: ExportOptions,
  onProgress: (done: number, total: number) => void,
): Promise<void> {
  const zip = new JSZip();
  onProgress(0, items.length);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const blob = await renderBlob(item, format, brand, opts);
    zip.file(`${item.fileBase}.${EXT[opts.type]}`, blob);
    onProgress(i + 1, items.length);
    // Let the UI breathe between large renders.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const manifest = Papa.unparse(
    items.map((item) => ({
      file: `${item.fileBase}.${EXT[opts.type]}`,
      code: item.code,
      domain: item.domain,
      type: item.type,
      level: item.level,
      title: item.title,
    })),
  );
  zip.file('manifest.csv', manifest);

  const out = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  const stamp = new Date().toISOString().slice(0, 10);
  saveAs(out, `thumbnails-${format.id}-${stamp}.zip`);
}
