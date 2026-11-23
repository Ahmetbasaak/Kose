import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import './app/theme.css';
import { router } from './app/router';
import { tryDevUnlock } from './app/entitlements';

tryDevUnlock(location.search);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
