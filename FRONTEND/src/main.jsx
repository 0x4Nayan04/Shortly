import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import {
  ToastProvider,
  OnlineStatusProvider,
  OfflineBanner
} from './components/UxEnhancements.jsx';

const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <>
        <App />
        <OfflineBanner />
      </>
    )
  }
]);

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <OnlineStatusProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </OnlineStatusProvider>
  </ErrorBoundary>
);
