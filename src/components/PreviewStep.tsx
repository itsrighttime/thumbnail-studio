import { useEffect, useState } from 'react';
import { usePreviews } from '../hooks/usePreviews';
import { exportSingle, exportZip, fileExt } from '../lib/exporter';
import type { Brand, ExportOptions, FormatSpec, ThumbnailItem } from '../types';
import ui from '../styles/ui.module.css';
import styles from './PreviewStep.module.css';

interface Props {
  format: FormatSpec;
  items: ThumbnailItem[];
  brand: Brand;
  options: ExportOptions;
  onOptions: (patch: Partial<ExportOptions>) => void;
}

export function PreviewStep({ format, items, brand, options, onOptions }: Props) {
  const { urls, done, total } = usePreviews(items, format, brand);
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (zoom === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);

  const outW = Math.round(format.width * options.scale);
  const outH = Math.round(format.height * options.scale);

  async function downloadOne(item: ThumbnailItem) {
    try {
      setError('');
      setBusyIndex(item.index);
      await exportSingle(item, format, brand, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setBusyIndex(null);
    }
  }

  async function downloadAll() {
    try {
      setError('');
      setZipProgress({ done: 0, total: items.length });
      await exportZip(items, format, brand, options, (d, t) => setZipProgress({ done: d, total: t }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the zip file.');
    } finally {
      setZipProgress(null);
    }
  }

  const zipping = zipProgress !== null;

  return (
    <section>
      <div className={styles.toolbar}>
        <div>
          <h2 className={ui.sectionTitle}>
            {items.length} thumbnail{items.length === 1 ? '' : 's'} ready
          </h2>
          <p className={ui.hint}>
            {done < total ? `Rendering previews… ${done}/${total}` : 'Click a thumbnail to enlarge it.'}
          </p>
        </div>

        <div className={styles.controls}>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="res">
              Resolution
            </label>
            <select id="res" className={ui.select} value={options.scale} onChange={(e) => onOptions({ scale: parseFloat(e.target.value) })}>
              {format.scales.map((s) => (
                <option key={s} value={s}>
                  {Math.round(format.width * s)} × {Math.round(format.height * s)}
                </option>
              ))}
            </select>
          </div>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="ftype">
              File type
            </label>
            <select
              id="ftype"
              className={ui.select}
              value={options.type}
              onChange={(e) => onOptions({ type: e.target.value as ExportOptions['type'] })}
            >
              <option value="png">PNG (lossless)</option>
              <option value="jpeg">JPG (smaller files)</option>
            </select>
          </div>
          <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={downloadAll} disabled={zipping || items.length === 0}>
            {zipping ? `Creating zip… ${zipProgress.done}/${zipProgress.total}` : `Download all (.zip)`}
          </button>
        </div>
      </div>

      <p className={ui.hint}>
        Downloads are rendered fresh at {outW} × {outH}px, not copied from the previews below.
        {options.type === 'png' && outW > 1920 ? ' Large PNGs can exceed YouTube’s 2 MB thumbnail limit — choose JPG if an upload is rejected.' : ''}
      </p>

      {zipping && (
        <div className={styles.progress} aria-hidden>
          <div className={styles.bar} style={{ width: `${(zipProgress.done / Math.max(1, zipProgress.total)) * 100}%` }} />
        </div>
      )}
      {error && <div className={ui.error}>{error}</div>}

      <div className={`${styles.grid} ${format.id === 'vertical' ? styles.gridV : styles.gridH}`}>
        {items.map((item) => {
          const url = urls[item.index] ?? null;
          return (
            <figure key={item.index} className={styles.card}>
              <button
                type="button"
                className={`${styles.thumb} ${format.id === 'vertical' ? styles.thumbV : styles.thumbH}`}
                onClick={() => url && setZoom(item.index)}
                aria-label={`Enlarge ${item.title}`}
              >
                {url ? <img src={url} alt={item.title} /> : <span className={styles.loading}>Rendering…</span>}
              </button>
              <figcaption className={styles.caption}>
                <div className={styles.captionText}>
                  <span className={styles.code}>{item.code || '—'}</span>
                  <span className={styles.title} title={item.title}>
                    {item.title}
                  </span>
                </div>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.small}`}
                  onClick={() => downloadOne(item)}
                  disabled={busyIndex === item.index || zipping}
                >
                  {busyIndex === item.index ? '…' : `.${fileExt(options.type)}`}
                </button>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {zoom !== null && urls[zoom] && (
        <div className={styles.lightbox} onClick={() => setZoom(null)} role="dialog" aria-modal="true" aria-label="Thumbnail preview">
          <img src={urls[zoom] ?? ''} alt={items[zoom]?.title ?? ''} />
          <button type="button" className={`${ui.btn} ${styles.close}`} onClick={() => setZoom(null)}>
            Close
          </button>
        </div>
      )}
    </section>
  );
}
