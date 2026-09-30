import React from 'react';
import Layout from './components/Layout.jsx';

/* 페이지는 필요한 것만 내려받도록 경로별로 코드 분할한다. */
export const ROUTES = {
  home: { load: () => import('./pages/Home.jsx'), tool: true },
  tracker: { load: () => import('./pages/Tracker.jsx'), tool: true },
  calculator: { load: () => import('./pages/Calculator.jsx'), tool: true },
  paycheckCheck: { load: () => import('./pages/PaycheckCheck.jsx'), tool: true },
  paycheck: { load: () => import('./pages/Paycheck.jsx'), tool: true },
  monthly: { load: () => import('./pages/Monthly.jsx'), tool: true },
  weekly: { load: () => import('./pages/WeeklyHolidayPay.jsx'), tool: true },
  night: { load: () => import('./pages/NightWorkPay.jsx'), tool: true },
  hourly: { load: () => import('./pages/HourlyWage.jsx'), tool: true },
  minimumWage: { load: () => import('./pages/MinimumWage.jsx'), tool: true },
  albaPay: { load: () => import('./pages/AlbaPay.jsx') },
  severance: { load: () => import('./pages/Severance.jsx'), tool: true },
  guide: { load: () => import('./pages/Guide.jsx') },
  privacy: { load: () => import('./pages/Privacy.jsx') },
  notFound: { load: () => import('./pages/NotFound.jsx') },
};

export default function App({ pageKey, Page }) {
  return (
    <Layout current={pageKey}>
      <Page />
    </Layout>
  );
}
