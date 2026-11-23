import type { InputHTMLAttributes } from 'react';
import s from '../app/pages/pages.module.css';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  /** Marks the input invalid and points it at the visible error message with this id. */
  errorId?: string | null;
}

export function Field({ id, label, errorId, className, ...rest }: FieldProps) {
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>
        {label}
      </label>
      <input
        id={id}
        className={[s.input, className].filter(Boolean).join(' ')}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId ?? undefined}
        {...rest}
      />
    </div>
  );
}
