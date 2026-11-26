import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { HomePage } from './pages/HomePage';

// Home ships in the main bundle (first paint); every other page loads on first visit.
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/mod/:slug', lazy: () => import('./pages/ModeSetupPage').then((m) => ({ Component: m.ModeSetupPage })) },
      { path: '/sayac', lazy: () => import('./pages/LivePage').then((m) => ({ Component: m.LivePage })) },
      { path: '/ozet', lazy: () => import('./pages/SummaryPage').then((m) => ({ Component: m.SummaryPage })) },
      {
        path: '/sayim',
        lazy: () => import('./pages/SharedCountdownPage').then((m) => ({ Component: m.SharedCountdownPage })),
      },
      { path: '/gecmis', lazy: () => import('./pages/HistoryPage').then((m) => ({ Component: m.HistoryPage })) },
      { path: '/ayarlar', lazy: () => import('./pages/SettingsPage').then((m) => ({ Component: m.SettingsPage })) },
      {
        path: '/basarilar',
        lazy: () => import('./pages/AchievementsPage').then((m) => ({ Component: m.AchievementsPage })),
      },
      {
        path: '/kac-gun-kaldi',
        lazy: () => import('./pages/SeoPages').then((m) => ({ Component: m.CountdownIndexPage })),
      },
      {
        path: '/kac-gun-kaldi/:slug',
        lazy: () => import('./pages/SeoPages').then((m) => ({ Component: m.HolidayCountdownPage })),
      },
      {
        path: '/hesapla/toplanti-maliyeti',
        lazy: () => import('./pages/SeoPages').then((m) => ({ Component: m.MeetingCalculatorPage })),
      },
      {
        path: '/hesapla/saatlik-ucret',
        lazy: () => import('./pages/SeoPages').then((m) => ({ Component: m.HourlyCalculatorPage })),
      },
      { path: '/istatistik', lazy: () => import('./pages/StatsPage').then((m) => ({ Component: m.StatsPage })) },
      { path: '/fiyat', lazy: () => import('./pages/PricingPage').then((m) => ({ Component: m.PricingPage })) },
      { path: '/gizlilik', lazy: () => import('./pages/PrivacyPage').then((m) => ({ Component: m.PrivacyPage })) },
      { path: '*', lazy: () => import('./pages/NotFoundPage').then((m) => ({ Component: m.NotFoundPage })) },
    ],
  },
  // Outside the layout: no header, footer or corner widget on stream.
  { path: '/overlay', lazy: () => import('./pages/OverlayPage').then((m) => ({ Component: m.OverlayPage })) },
]);
