import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { HomePage } from './pages/HomePage';
import { ModeSetupPage } from './pages/ModeSetupPage';
import { LivePage } from './pages/LivePage';
import { SummaryPage } from './pages/SummaryPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/mod/:slug', element: <ModeSetupPage /> },
      { path: '/sayac', element: <LivePage /> },
      { path: '/ozet', element: <SummaryPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
