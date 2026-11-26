import styles from './RollingValue.module.css';

/**
 * "01:23:45" or "1.150,47 ₺" where each digit that changes rolls in from above.
 * Characters are keyed by their position from the end, so a value growing a digit
 * ("9:59" → "10:00") only animates what really changed.
 */
export function RollingValue({ text }: { text: string }) {
  const chars = [...text];
  return (
    // One wrapper span: in flex parents bare text nodes become items and lose spaces.
    <span>
      {chars.map((c, i) => {
        const key = `${chars.length - i}:${c}`;
        return /\d/.test(c) ? (
          <span key={key} className={styles.digit}>
            {c}
          </span>
        ) : (
          <span key={key}>{c}</span>
        );
      })}
    </span>
  );
}
