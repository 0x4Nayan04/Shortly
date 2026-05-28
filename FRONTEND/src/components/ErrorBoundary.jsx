import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='app-page min-h-screen bg-background flex items-center justify-center px-4'>
          <div className='app-panel max-w-md w-full error-boundary-container'>
            <div className='error-boundary-icon'>
              <AlertTriangle aria-hidden='true' />
            </div>
            <h2 className='error-boundary-title'>
              Something went wrong
            </h2>
            <p className='error-boundary-message'>
              We're sorry, but something unexpected happened. Please try
              refreshing the page.
            </p>
            <div className='error-boundary-actions'>
              <button
                onClick={() => window.location.reload()}
                className='sm-btn sm-btn-primary'
              >
                Refresh page
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className='mt-6 text-left'>
                <summary className='cursor-pointer text-sm text-muted hover:text-ink'>
                  Error details (development)
                </summary>
                <pre className='mt-2 text-xs text-error bg-error-tint border border-error-border p-3 overflow-auto'>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
