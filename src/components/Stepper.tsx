import styles from './Stepper.module.css';

interface Props {
  steps: string[];
  current: number;
  /** Highest step the user may jump to. */
  reachable: number;
  onGo: (index: number) => void;
}

export function Stepper({ steps, current, reachable, onGo }: Props) {
  return (
    <ol className={styles.list}>
      {steps.map((label, i) => {
        const state = i === current ? styles.active : i < current ? styles.done : '';
        return (
          <li key={label} className={styles.item}>
            <button
              type="button"
              className={`${styles.step} ${state}`}
              disabled={i > reachable}
              onClick={() => onGo(i)}
              aria-current={i === current ? 'step' : undefined}
            >
              <span className={styles.num}>{i < current ? '✓' : i + 1}</span>
              <span className={styles.label}>{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
