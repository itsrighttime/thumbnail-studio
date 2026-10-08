import { useRef, useState, type DragEvent } from 'react';
import { parseFile, parseText } from '../lib/parseTable';
import type { ParsedTable } from '../types';
import ui from '../styles/ui.module.css';
import styles from './UploadStep.module.css';

interface Props {
  table: ParsedTable | null;
  fileName: string;
  onLoaded: (table: ParsedTable, name: string) => void;
}

const ACCEPT = '.csv,.tsv,.txt,.md,.markdown,.xlsx,.xlsm,.xlsb,.xls,.ods';

export function UploadStep({ table, fileName, onLoaded }: Props) {
  const [tab, setTab] = useState<'file' | 'paste'>('file');
  const [pasted, setPasted] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load(f: File, sheet?: string) {
    try {
      setError('');
      const parsed = await parseFile(f, sheet);
      setFile(f);
      onLoaded(parsed, f.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this file.');
    }
  }

  function loadPasted() {
    try {
      setError('');
      onLoaded(parseText(pasted), 'Pasted table');
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this text.');
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) void load(dropped);
  }

  return (
    <section>
      <h2 className={ui.sectionTitle}>Add your content table</h2>
      <p className={ui.sectionSub}>
        One row per thumbnail. Use a CSV, an Excel sheet or a Markdown table with columns for domain, type and title
        (and optionally level or code).
      </p>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'file'}
          className={`${styles.tab} ${tab === 'file' ? styles.tabActive : ''}`}
          onClick={() => setTab('file')}
        >
          Upload file
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'paste'}
          className={`${styles.tab} ${tab === 'paste' ? styles.tabActive : ''}`}
          onClick={() => setTab('paste')}
        >
          Paste table
        </button>
      </div>

      {tab === 'file' ? (
        <div
          className={`${styles.drop} ${dragging ? styles.dragging : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            hidden
            onChange={(e) => {
              const picked = e.target.files?.[0];
              if (picked) void load(picked);
              e.target.value = '';
            }}
          />
          <div className={styles.dropIcon} aria-hidden>
            ⬆
          </div>
          <strong>Drop a file here, or click to browse</strong>
          <span className={styles.dropHint}>.csv · .xlsx · .xls · .md (Markdown table) · .tsv</span>
        </div>
      ) : (
        <div className={ui.field}>
          <textarea
            className={ui.textarea}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder={'| Domain | Type | Title |\n|---|---|---|\n| PostgreSQL | Theory | Why your database query is slow |'}
            spellCheck={false}
          />
          <div>
            <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={loadPasted} disabled={!pasted.trim()}>
              Read table
            </button>
          </div>
        </div>
      )}

      <p className={ui.hint} style={{ marginTop: 12 }}>
        Need a starting point? Download the sample{' '}
        <a href="/sample-thumbnails.csv" download>
          CSV
        </a>{' '}
        or{' '}
        <a href="/sample-thumbnails.md" download>
          Markdown table
        </a>
        .
      </p>

      {error && <div className={ui.error}>{error}</div>}

      {table && (
        <div className={styles.loaded}>
          <div className={styles.loadedHead}>
            <div>
              <strong>{fileName}</strong>
              <span className={styles.count}>
                {' '}
                · {table.rows.length} row{table.rows.length === 1 ? '' : 's'} · {table.headers.length} column
                {table.headers.length === 1 ? '' : 's'}
              </span>
            </div>
            {file && table.sheetNames && table.sheetNames.length > 1 && (
              <label className={styles.sheetPick}>
                Sheet
                <select
                  className={ui.select}
                  value={table.sheet}
                  onChange={(e) => void load(file, e.target.value)}
                >
                  {table.sheetNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {table.headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.slice(0, 6).map((row, i) => (
                  <tr key={i}>
                    {table.headers.map((h) => (
                      <td key={h}>{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {table.rows.length > 6 && <p className={ui.hint}>Showing the first 6 of {table.rows.length} rows.</p>}
        </div>
      )}
    </section>
  );
}
