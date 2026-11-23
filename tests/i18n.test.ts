import { describe, expect, it } from 'vitest';
import { t } from '../src/i18n';

describe('i18n', () => {
  it('resolves nested keys and fills variables', () => {
    expect(t('home.title')).toBe('Ne sayacağız?');
    expect(t('alert.doneBody', { label: 'Çay' })).toBe('Çay tamamlandı.');
  });

  it('leaves unknown placeholders visible instead of dropping them', () => {
    expect(t('setup.modeLabel')).toBe('Mod: {mode}');
  });
});
