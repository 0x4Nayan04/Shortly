import { AlertCircle } from 'lucide-react';
import { formAlertClass } from '../../utils/designFormClasses';

export default function FormAlert({ error, className = '', children }) {
  if (!error && !children) return null;

  return (
    <div
      className={`${formAlertClass}${className ? ` ${className}` : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center">
        <AlertCircle className="size-5 mr-2 shrink-0" aria-hidden="true" />
        {error || children}
      </div>
    </div>
  );
}
