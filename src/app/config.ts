import brand from '../../brand.config.json';

export const config = brand;

/** ASCII file-name stem from the brand ("TimerZ" → "timerz"); some browsers drop non-ASCII download names. */
export const brandSlug = brand.name
  .replace(/ı/g, 'i')
  .replace(/İ/g, 'I')
  .normalize('NFD')
  .replace(/[^A-Za-z0-9]+/g, '')
  .toLowerCase();
