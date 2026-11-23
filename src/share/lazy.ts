import { lazy } from 'react';

// Canvas card code stays out of the main bundle until someone opens a card.
export const LazyShareCard = lazy(() => import('./ShareCard').then((m) => ({ default: m.ShareCard })));
export const LazyCardExport = lazy(() => import('./ShareCard').then((m) => ({ default: m.CardExport })));
