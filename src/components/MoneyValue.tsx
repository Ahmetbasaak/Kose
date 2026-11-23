import { formatMoney } from '../engine/format';
import styles from './MoneyValue.module.css';

/** "1.150,47 ₺" where the kuruş digits get a soft tick whenever they change. */
export function MoneyValue({ amount }: { amount: number }) {
  const [whole, rest = ''] = formatMoney(amount).split(',');
  const kurus = rest.slice(0, 2);
  return (
    // One wrapper span: in flex parents bare text nodes become items and lose the space before ₺.
    <span>
      {whole},
      <span key={kurus} className={styles.kurus}>
        {kurus}
      </span>
      {rest.slice(2)}
    </span>
  );
}
