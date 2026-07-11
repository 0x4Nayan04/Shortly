import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { CONTACT_CHANNELS } from '../../constants/contacts';
import { ROUTES } from '../../constants/routes';

export function ContactMailtoLink({ email, className = 'landing-text-link' }) {
  return (
    <a href={`mailto:${email}`} className={className}>
      {email}
    </a>
  );
}

export function ContactChannelsList({ className = '' }) {
  return (
    <ul className={`grid gap-4 sm:grid-cols-3 ${className}`}>
      {CONTACT_CHANNELS.map((channel) => (
        <li key={channel.id} className="app-panel">
          <div className="mb-2 flex items-center gap-2">
            <Mail className="size-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-ink">{channel.label}</h3>
          </div>
          <p className="text-sm text-muted-strong">{channel.description}</p>
          <p className="mt-3 text-sm">
            <ContactMailtoLink email={channel.email} />
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ContactSupportHint({ className = 'text-sm text-error' }) {
  return (
    <p className={className}>
      Maximum retry attempts reached. Please refresh the page or{' '}
      <Link to={ROUTES.CONTACT} className="landing-text-link font-medium">
        contact support
      </Link>
      .
    </p>
  );
}
