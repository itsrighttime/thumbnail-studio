import type { FormatId, FormatSpec } from './types';

/**
 * Canvas sizes and positions, measured from the two sample thumbnails.
 * All numbers are in base pixels (vertical 540x960, horizontal 1280x720);
 * the exporter multiplies them by the chosen scale, so layout never changes
 * between preview and export.
 *
 * "cy" = vertical centre of a line. Titles are fitted to the box between
 * title.top and title.bottom and centred inside it.
 */
export const FORMATS: Record<FormatId, FormatSpec> = {
  vertical: {
    id: 'vertical',
    label: 'Vertical',
    sub: 'Instagram · 9:16',
    width: 540,
    height: 960,
    scales: [1, 2, 3],
    defaultScale: 2, // 1080 x 1920
    platformCode: 'IG',
    showLevelDefault: false,
    defaultPattern: '{P}-{D}-{T}-{N}',
    defaultPadding: 3,
    layout: {
      header: { cy: 52, maxSize: 44, minSize: 20, maxWidth: 480, tracking: 0 },
      title: { top: 100, bottom: 786, maxWidth: 516, maxSize: 78, minSize: 28, lineHeight: 1.2 },
      handle: { x: 270, cy: 821, size: 33, maxWidth: 480, align: 'center' },
      channel: { x: 270, cy: 859, size: 36, maxWidth: 480, align: 'center' },
      code: { x: 270, cy: 912, maxSize: 72, minSize: 26, maxWidth: 440, tracking: 0.01, align: 'center' },
      backdrop: { rows: 4, maxWidthFrac: 0.72, gap: 1.22 },
    },
  },
  horizontal: {
    id: 'horizontal',
    label: 'Horizontal',
    sub: 'YouTube · 16:9',
    width: 1280,
    height: 720,
    scales: [1, 1.5, 2],
    defaultScale: 1.5, // 1920 x 1080
    platformCode: 'YT',
    showLevelDefault: true,
    defaultPattern: '{P}-{D}-{T}-{L}-{N}/{TOTAL}',
    defaultPadding: 2,
    layout: {
      header: { cy: 65, maxSize: 46, minSize: 22, maxWidth: 960, tracking: 0.07 },
      title: { top: 112, bottom: 612, maxWidth: 1030, maxSize: 108, minSize: 36, lineHeight: 1.2 },
      handle: { x: 1245, cy: 640, size: 36, maxWidth: 420, align: 'right' },
      channel: { x: 1245, cy: 690, size: 40, maxWidth: 420, align: 'right' },
      code: { x: 50, cy: 668, maxSize: 62, minSize: 24, maxWidth: 640, tracking: 0.08, align: 'left' },
      backdrop: { rows: 2, maxWidthFrac: 0.8, gap: 1.5 },
    },
  },
};

export const FORMAT_LIST: FormatSpec[] = [FORMATS.vertical, FORMATS.horizontal];
