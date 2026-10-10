import { useMemo } from 'react';
import { useDebounced, usePreviews } from '../hooks/usePreviews';
import { FIELDS, validateMapping } from '../lib/mapping';
import type { Brand, CodeScope, CodeSettings, FieldKey, FieldMapping, FormatSpec, Mapping, ParsedTable, ThumbnailItem } from '../types';
import ui from '../styles/ui.module.css';
import styles from './MappingStep.module.css';

interface Props {
  format: FormatSpec;
  table: ParsedTable;
  mapping: Mapping;
  onMapping: (key: FieldKey, patch: Partial<FieldMapping>) => void;
  brand: Brand;
  onBrand: (patch: Partial<Brand>) => void;
  code: CodeSettings;
  onCode: (patch: Partial<CodeSettings>) => void;
  items: ThumbnailItem[];
  skipped: number;
}

const NONE = '';

const TOKENS: [string, string][] = [
  ['{P}', 'platform code'],
  ['{D}', 'domain initials'],
  ['{T}', 'type letters'],
  ['{L}', 'level'],
  ['{N}', 'counter (start, step, padding)'],
  ['{N:3}', 'counter, forced 3 digits'],
  ['{TOTAL}', 'rows in the counter group'],
  ['{ROW}', 'row number in the file'],
];

export function MappingStep({ format, table, mapping, onMapping, brand, onBrand, code, onCode, items, skipped }: Props) {
  const problems = validateMapping(mapping);
  const levelAvailable = !!mapping.level.column || !!mapping.level.fixed.trim();

  const debouncedItems = useDebounced(items, 250);
  const debouncedBrand = useDebounced(brand, 250);
  const { urls } = usePreviews(debouncedItems, format, debouncedBrand, 1);
  const previewUrl = urls[0] ?? null;

  const sampleCodes = useMemo(() => items.slice(0, 3).map((i) => i.code), [items]);

  return (
    <section className={styles.layout}>
      <div className={styles.main}>
        <div>
          <h2 className={ui.sectionTitle}>Map your columns</h2>
          <p className={ui.sectionSub}>
            We matched the columns automatically. Change any of them, or type a fixed value to use for every row.
          </p>

          <div className={styles.fields}>
            {FIELDS.map((def) => {
              const m = mapping[def.key];
              return (
                <div key={def.key} className={styles.fieldRow}>
                  <div className={ui.field}>
                    <label className={ui.label} htmlFor={`col-${def.key}`}>
                      {def.label}
                      <span className={def.required ? ui.badge : ui.badgeMuted}>{def.required ? 'Required' : 'Optional'}</span>
                    </label>
                    <select
                      id={`col-${def.key}`}
                      className={ui.select}
                      value={m.column ?? NONE}
                      onChange={(e) => onMapping(def.key, { column: e.target.value === NONE ? null : e.target.value })}
                    >
                      <option value={NONE}>{def.allowFixed ? '— use fixed value —' : '— not in my file —'}</option>
                      {table.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <p className={ui.hint}>{def.hint}</p>
                  </div>

                  {def.allowFixed && (
                    <div className={ui.field}>
                      <label className={ui.label} htmlFor={`fixed-${def.key}`}>
                        {m.column ? 'Default if cell is empty' : 'Fixed value'}
                      </label>
                      <input
                        id={`fixed-${def.key}`}
                        className={ui.input}
                        value={m.fixed}
                        placeholder={def.placeholder}
                        onChange={(e) => onMapping(def.key, { fixed: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {problems.map((p) => (
            <div key={p} className={ui.error}>
              {p}
            </div>
          ))}
          {skipped > 0 && (
            <div className={ui.note}>
              {skipped} row{skipped === 1 ? '' : 's'} without a title will be skipped.
            </div>
          )}
        </div>

        <div className={ui.card}>
          <h3 className={ui.sectionTitle}>Fixed text &amp; style</h3>
          <p className={ui.sectionSub}>The same on every thumbnail.</p>
          <div className={styles.grid2}>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="handle">
                Username
              </label>
              <input id="handle" className={ui.input} value={brand.handle} onChange={(e) => onBrand({ handle: e.target.value })} />
            </div>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="channel">
                Channel name
              </label>
              <input id="channel" className={ui.input} value={brand.channel} onChange={(e) => onBrand({ channel: e.target.value })} />
            </div>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="bg">
                Background colour
              </label>
              <div className={styles.colorRow}>
                <input
                  type="color"
                  aria-label="Pick background colour"
                  className={styles.swatch}
                  value={brand.bg}
                  onChange={(e) => onBrand({ bg: e.target.value })}
                />
                <input
                  id="bg"
                  className={ui.input}
                  value={brand.bg}
                  onChange={(e) => onBrand({ bg: e.target.value })}
                  spellCheck={false}
                />
              </div>
            </div>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={brand.showLevelInHeader}
                disabled={!levelAvailable}
                onChange={(e) => onBrand({ showLevelInHeader: e.target.checked })}
              />
              <span>
                Show level in header (e.g. “System Design | Theory - L1”)
                {!levelAvailable && <em className={styles.muted}> — map a level column first</em>}
              </span>
            </label>
          </div>
        </div>

        <div className={ui.card}>
          <h3 className={ui.sectionTitle}>Sequence code</h3>
          <p className={ui.sectionSub}>
            Generated for every row from this pattern, unless the row already has a code in your file.
          </p>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="pattern">
              Pattern
            </label>
            <input
              id="pattern"
              className={`${ui.input} ${styles.mono}`}
              value={code.pattern}
              onChange={(e) => onCode({ pattern: e.target.value })}
              spellCheck={false}
            />
          </div>
          <ul className={styles.tokens}>
            {TOKENS.map(([token, desc]) => (
              <li key={token}>
                <button type="button" className={styles.token} onClick={() => onCode({ pattern: code.pattern + token })} title="Add to pattern">
                  {token}
                </button>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
          <div className={styles.grid4}>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="platform">
                Platform code {'{P}'}
              </label>
              <input id="platform" className={ui.input} value={code.platform} onChange={(e) => onCode({ platform: e.target.value })} />
            </div>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="start">
                Start at
              </label>
              <input
                id="start"
                type="number"
                min={0}
                className={ui.input}
                value={code.start}
                onChange={(e) => onCode({ start: Math.max(0, parseInt(e.target.value, 10) || 0) })}
              />
            </div>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="step">
                Step
              </label>
              <input
                id="step"
                type="number"
                min={1}
                className={ui.input}
                value={code.step}
                onChange={(e) => onCode({ step: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              />
            </div>
            <div className={ui.field}>
              <label className={ui.label} htmlFor="padding">
                Padding (digits)
              </label>
              <input
                id="padding"
                type="number"
                min={0}
                max={8}
                className={ui.input}
                value={code.padding}
                onChange={(e) => onCode({ padding: Math.min(8, Math.max(0, parseInt(e.target.value, 10) || 0)) })}
              />
              <p className={ui.hint}>
                {code.padding > 0 ? `${code.start} → ${String(code.start).padStart(code.padding, '0')}` : 'No leading zeros'}
              </p>
            </div>
          </div>
          <div className={ui.field} style={{ marginTop: 14 }}>
            <label className={ui.label} htmlFor="scope">
              Counter runs
            </label>
            <select id="scope" className={ui.select} value={code.scope} onChange={(e) => onCode({ scope: e.target.value as CodeScope })}>
              <option value="all">across all rows</option>
              <option value="domain">restarting for each domain</option>
              <option value="domainLevel">restarting for each domain + level</option>
            </select>
          </div>
          {sampleCodes.length > 0 && (
            <p className={ui.hint} style={{ marginTop: 12 }}>
              First codes: <span className={styles.mono}>{sampleCodes.join('   ')}</span>
            </p>
          )}
        </div>
      </div>

      <aside className={styles.aside}>
        <div className={styles.sticky}>
          <h3 className={ui.sectionTitle}>Live preview</h3>
          <p className={ui.hint} style={{ marginBottom: 12 }}>
            Row 1 of {items.length}
          </p>
          <div className={`${styles.frame} ${format.id === 'vertical' ? styles.frameV : styles.frameH}`}>
            {previewUrl ? <img src={previewUrl} alt="Preview of the first thumbnail" /> : <span className={ui.hint}>Rendering…</span>}
          </div>
        </div>
      </aside>
    </section>
  );
}
