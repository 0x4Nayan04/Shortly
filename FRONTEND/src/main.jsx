import { createRoot } from 'react-dom/client';
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
      <OnlineStatusProvider>
        <ToastProvider>
          <RouterProvider
            router={router}
            future={{ v7_startTransition: true }}
          />
        </ToastProvider>
      </OnlineStatusProvider>
    </ErrorBoundary>
  );
}
