if (import.meta.env.DEV) {
  void import('react-grab').then((grab) => {
    const placeMobileToolbar = () => {
      const api = grab.getGlobalApi?.();
      if (!api?.setToolbarState) return false;
      if (window.matchMedia('(max-width: 767px)').matches) {
        api.setToolbarState({ edge: 'bottom', ratio: 0.06 });
      }
      return true;
    };

    if (!placeMobileToolbar()) {
      const timer = window.setInterval(() => {
        if (placeMobileToolbar()) window.clearInterval(timer);
      }, 50);
      window.setTimeout(() => window.clearInterval(timer), 3000);
    }

    window
      .matchMedia('(max-width: 767px)')
      .addEventListener('change', placeMobileToolbar);
  });
}

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
