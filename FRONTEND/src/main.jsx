import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { ToastProvider, OnlineStatusProvider, OfflineBanner } from "./components/UxEnhancements.jsx";

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <OnlineStatusProvider>
      <ToastProvider>
        <BrowserRouter>
          <App />
          <OfflineBanner />
        </BrowserRouter>
      </ToastProvider>
    </OnlineStatusProvider>
  </ErrorBoundary>
);
