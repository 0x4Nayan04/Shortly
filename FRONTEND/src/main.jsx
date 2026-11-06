import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import ConfigError from './components/ConfigError.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import {
  ToastProvider,
  OnlineStatusProvider,
  OfflineBanner
} from './components/UxEnhancements.jsx';
import { apiConfigError } from './config/api.js';
import { queryClient } from './queryClient.js';

const lcpShell = document.getElementById('landing-lcp-shell');
if (
  lcpShell &&
  window.location.pathname !== '/' &&
  window.location.pathname !== ''
) {
  lcpShell.hidden = true;
}

const root = createRoot(document.getElementById('root'));

if (apiConfigError) {
  root.render(<ConfigError message={apiConfigError} />);
} else {
  const router = createBrowserRouter(
    [
      {
        path: '*',
        element: (
          <>
            <AuthProvider>
              <App />
            </AuthProvider>
            <OfflineBanner />
          </>
        )
      }
    ],
    { future: { v7_relativeSplatPath: true } }
  );

  root.render(
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <OnlineStatusProvider>
          <ToastProvider>
            <RouterProvider
              router={router}
              future={{ v7_startTransition: true }}
            />
          </ToastProvider>
        </OnlineStatusProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
