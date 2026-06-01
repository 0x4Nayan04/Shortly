import { ErrorPanel } from './ErrorPanel';

export default function ConfigError({ message }) {
  return (
    <div
      className='min-h-screen bg-background flex items-center justify-center px-4 py-12'
      style={{
        backgroundImage: 'var(--grad-dot)',
        backgroundSize: '24px 24px'
      }}>
      <ErrorPanel
        variant='prominent'
        headingLevel='h1'
        title='Configuration error'
        description={message}>
        <p className='text-sm text-muted leading-relaxed max-w-xs mx-auto'>
          Set <code className='text-ink'>VITE_APP_URL</code> to your API origin
          and rebuild the app.
        </p>
      </ErrorPanel>
    </div>
  );
}
