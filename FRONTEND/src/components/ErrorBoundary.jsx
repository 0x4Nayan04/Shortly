import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
        <div className='min-h-screen bg-background flex items-center justify-center px-4 py-12'
          style={{ backgroundImage: 'var(--grad-dot)', backgroundSize: '24px 24px' }}>
          <div className='w-full max-w-md bg-surface border border-border p-10 text-center animate-fade-in'
            style={{ boxShadow: 'rgba(11,16,21,0.08) 0px 32px 64px -24px, rgba(11,16,21,0.04) 0px 0px 0px 1px' }}>
            <div className='w-14 h-14 mx-auto mb-6 rounded-full flex items-center justify-center'
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, var(--color-surface))', borderColor: 'color-mix(in srgb, var(--color-error) 30%, var(--color-border))' }}>
              <AlertTriangle className='w-6 h-6 text-error' aria-hidden='true' />
            </div>

            <h1 className='font-display text-xl font-medium text-ink mb-2'>
              Something went wrong
            </h1>
            <p className='text-sm text-muted leading-relaxed mb-8 max-w-xs mx-auto'>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>

            <button
              onClick={() => window.location.reload()}
              className='inline-flex items-center gap-2 px-5 py-2.5 bg-error text-white text-sm font-medium border border-error transition-all duration-150 hover:opacity-90'>
              <RefreshCw className='w-4 h-4' />
              Refresh page
            </button>

            {import.meta.env.DEV && this.state.error && (
              <details className='mt-8 text-left group'>
                <summary className='cursor-pointer text-xs text-muted hover:text-ink transition-colors duration-150 font-medium'>
                  Error details (development)
                </summary>
                <pre className='mt-3 text-xs text-error p-4 overflow-auto leading-relaxed whitespace-pre-wrap'
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-error) 5%, var(--color-surface))', borderColor: 'color-mix(in srgb, var(--color-error) 20%, var(--color-border))' }}>
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
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
