import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import BottomNav from '@/components/shared/BottomNav';

// Lazy-loaded pages for code splitting
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const AddTransaction = lazy(() => import('@/pages/AddTransaction'));
const Reports = lazy(() => import('@/pages/Reports'));
const Settings = lazy(() => import('@/pages/Settings'));
const ImportBill = lazy(() => import('@/pages/ImportBill'));
const TransactionList = lazy(() => import('@/pages/TransactionList'));
const Budget = lazy(() => import('@/pages/Budget'));
const Accounts = lazy(() => import('@/pages/Accounts'));

// Pages that don't show bottom nav
const FULLSCREEN_PAGES = ['/import'];

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const location = useLocation();
  const hideNav = FULLSCREEN_PAGES.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Main content area */}
      <main className={`flex-1 ${hideNav ? '' : 'pb-16'}`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddTransaction />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/import" element={<ImportBill />} />
            <Route path="/transactions" element={<TransactionList />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/accounts" element={<Accounts />} />
          </Routes>
        </Suspense>
      </main>

      {/* Bottom Navigation */}
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default App;
