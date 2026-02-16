import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import i18n from './lib/i18n';

// Layout
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { RouteLoading } from './components/LoadingState';
import { ErrorBoundary } from './components/ErrorBoundary';
import { trackPageView } from './utils/analytics';

// Lazy Loaded Pages
const Results = lazy(() => import('./pages/Results'));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary onReset={() => window.location.reload()}>
          <Router>
            <AnalyticsTracker />
            <Suspense fallback={<RouteLoading message={i18n.t('layout.loading_page')} />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="results" element={<Results />} />
                  <Route path="about" element={<About />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </ErrorBoundary>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
