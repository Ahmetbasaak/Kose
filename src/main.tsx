import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import './app/theme.css';
import { router } from './app/router';
import { tryDevUnlock } from './app/entitlements';
import { applyAppearance } from './app/appearance';
import { usePrefsStore } from './storage/prefs';

tryDevUnlock(location.search);
// Before the first render, so a saved theme doesn't flash.
applyAppearance(usePrefsStore.getState().appTheme, usePrefsStore.getState().reduceMotion);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
