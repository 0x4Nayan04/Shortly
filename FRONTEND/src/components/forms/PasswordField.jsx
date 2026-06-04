import FormField from './FormField';
import PasswordVisibilityToggle from '../PasswordVisibilityToggle';

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  autoComplete,
  showPassword,
  onToggleVisibility
}) {
  return (
    <div>
      <label htmlFor={id} className="sm-label">
        {label}
      </label>
      <div className="relative">
        <FormField
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          error={error}
          touched={touched}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputClassName="pr-12"
        />
        <PasswordVisibilityToggle
          visible={showPassword}
          onToggle={onToggleVisibility}
        />
      </div>
    </div>
  );
}
