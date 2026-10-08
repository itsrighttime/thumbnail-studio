import { FORMAT_LIST } from '../formats';
import type { FormatId } from '../types';
import ui from '../styles/ui.module.css';
import styles from './FormatStep.module.css';

interface Props {
  value: FormatId | null;
  onChange: (id: FormatId) => void;
}

export function FormatStep({ value, onChange }: Props) {
  return (
    <section>
      <h2 className={ui.sectionTitle}>Choose a thumbnail format</h2>
      <p className={ui.sectionSub}>
        The layout, fonts and colours are identical in both; only the canvas shape and footer placement change.
      </p>

      <div className={styles.grid}>
        {FORMAT_LIST.map((f) => {
          const maxScale = f.scales[f.scales.length - 1];
          return (
            <button
              key={f.id}
              type="button"
              className={`${styles.option} ${value === f.id ? styles.selected : ''}`}
              onClick={() => onChange(f.id)}
              aria-pressed={value === f.id}
            >
              <div className={styles.stage}>
                <div className={`${styles.mock} ${f.id === 'vertical' ? styles.vertical : styles.horizontal}`}>
                  <span className={styles.mockHeader} />
                  <span className={styles.mockTitle} />
                  <span className={styles.mockTitleShort} />
                  <span className={styles.mockFooter} />
                </div>
              </div>
              <div className={styles.meta}>
                <strong>{f.label}</strong>
                <span className={styles.sub}>{f.sub}</span>
                <span className={styles.size}>
                  {f.width} × {f.height} base · up to {Math.round(f.width * maxScale)} × {Math.round(f.height * maxScale)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
