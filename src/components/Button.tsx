import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';

const cls = (variant: Variant, extra?: string) => [styles.btn, styles[variant], extra].filter(Boolean).join(' ');

export function Button({
  variant = 'secondary',
  className,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={cls(variant, className)} {...rest} />;
}

export function ButtonLink({ variant = 'secondary', className, ...rest }: LinkProps & { variant?: Variant }) {
  return <Link className={cls(variant, className)} {...rest} />;
}
