import { formSuccessIconWrapClass } from '../../utils/designFormClasses';

export default function SuccessPanel({
  icon,
  heading,
  message,
  primaryAction,
  secondaryAction,
  children
}) {
  return (
    <div className="app-panel text-center">
      {icon && <div className={formSuccessIconWrapClass}>{icon}</div>}
      <h2 className="font-display text-xl font-medium tracking-display text-ink mb-2">
        {heading}
      </h2>
      {message && <p className="text-muted-strong mb-6">{message}</p>}
      {primaryAction && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
      {!primaryAction && secondaryAction}
      {children}
    </div>
  );
}
