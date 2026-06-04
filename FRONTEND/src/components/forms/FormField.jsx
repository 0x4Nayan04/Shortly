import { getDesignInputClass } from '../../utils/designFormClasses';

export default function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  autoComplete,
  inputClassName = '',
  describedBy,
  required = false
}) {
  const showError = Boolean(touched && error);
  const errorId = `${id}-error`;
  const ariaDescribedBy = showError ? errorId : describedBy;

  return (
    <div>
      <label htmlFor={id} className="sm-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className={getDesignInputClass({
          hasError: showError,
          className: inputClassName
        })}
        aria-invalid={showError ? 'true' : 'false'}
        aria-describedby={ariaDescribedBy}
      />
      {showError && (
        <p id={errorId} className="sm-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
