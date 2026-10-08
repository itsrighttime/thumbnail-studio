import { useEffect, useMemo, useRef, useState } from 'react';
import { canvasToBlob, renderToCanvas } from '../lib/renderThumbnail';
import type { Brand, FormatSpec, ThumbnailItem } from '../types';

/** Returns `value` after it has stopped changing for `delay` ms. */
export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Renders preview images (1x scale) one after another so the page stays
 * responsive. Old images stay on screen until their replacement is ready.
 */
export function usePreviews(items: ThumbnailItem[], format: FormatSpec, brand: Brand, limit?: number) {
  const list = useMemo(() => (limit ? items.slice(0, limit) : items), [items, limit]);
  const [urls, setUrls] = useState<(string | null)[]>([]);
  const [done, setDone] = useState(0);
  const urlsRef = useRef<(string | null)[]>([]);

  // Free everything on unmount.
  useEffect(
    () => () => {
      urlsRef.current.forEach((u) => u && URL.revokeObjectURL(u));
      urlsRef.current = [];
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    if (urlsRef.current.length > list.length) {
      urlsRef.current.slice(list.length).forEach((u) => u && URL.revokeObjectURL(u));
      urlsRef.current = urlsRef.current.slice(0, list.length);
      setUrls([...urlsRef.current]);
    }
    setDone(0);

    (async () => {
      for (let i = 0; i < list.length; i++) {
        if (cancelled) return;
        try {
          const canvas = await renderToCanvas(list[i], { format, brand, scale: 1 });
          const blob = await canvasToBlob(canvas, 'image/png');
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          const old = urlsRef.current[i];
          urlsRef.current[i] = url;
          if (old) URL.revokeObjectURL(old);
          setUrls([...urlsRef.current]);
        } catch (err) {
          console.error('Preview failed', err);
        }
        setDone(i + 1);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [list, format, brand]);

  return { urls, done, total: list.length };
}
