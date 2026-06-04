import React from 'react';
import { RefreshCw } from 'lucide-react';
import { ErrorPanel, errorActionButtonClass } from './ErrorPanel';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-background flex items-center justify-center px-4 py-12"
          style={{
            backgroundImage: 'var(--grad-dot)',
            backgroundSize: '24px 24px'
          }}
        >
          <ErrorPanel
            variant="prominent"
            headingLevel="h1"
            title="Something went wrong"
            description="We're sorry, but something unexpected happened. Please try refreshing the page."
          >
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`${errorActionButtonClass} px-5 py-2.5`}
            >
              <RefreshCw className="size-4" />
              Refresh page
            </button>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left group">
                <summary className="cursor-pointer text-xs text-muted hover:text-ink transition-colors duration-150 font-medium">
                  Error details (development)
                </summary>
                <pre
                  className="mt-3 text-xs text-error p-4 overflow-auto leading-relaxed whitespace-pre-wrap border"
                  style={{
                    backgroundColor:
                      'color-mix(in srgb, var(--color-error) 5%, var(--color-surface))',
                    borderColor:
                      'color-mix(in srgb, var(--color-error) 20%, var(--color-border))'
                  }}
                >
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </ErrorPanel>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
