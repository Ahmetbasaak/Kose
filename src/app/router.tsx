import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { HomePage } from './pages/HomePage';
import { ModeSetupPage } from './pages/ModeSetupPage';
import { LivePage } from './pages/LivePage';
import { SummaryPage } from './pages/SummaryPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OverlayPage } from './pages/OverlayPage';
import { SharedCountdownPage } from './pages/SharedCountdownPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/mod/:slug', element: <ModeSetupPage /> },
      { path: '/sayac', element: <LivePage /> },
      { path: '/ozet', element: <SummaryPage /> },
      { path: '/sayim', element: <SharedCountdownPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // Outside the layout: no header, footer or corner widget on stream.
  { path: '/overlay', element: <OverlayPage /> },
]);
