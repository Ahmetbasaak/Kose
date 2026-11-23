import type { AppTheme } from '../storage/prefs';
import { isPro } from './entitlements';

/** Puts theme and motion settings on <html> (main window and the PiP window). */
export function applyAppearance(theme: AppTheme, reduceMotion: boolean, docs: Document[] = [document]) {
  // Retro is Pro; without it fall back to following the device.
  const t = theme === 'retro' && !isPro() ? 'system' : theme;
  for (const d of docs) {
    const el = d.documentElement;
    if (t === 'system') delete el.dataset.theme;
    else el.dataset.theme = t;
    el.toggleAttribute('data-reduce-motion', reduceMotion);
  }
}
