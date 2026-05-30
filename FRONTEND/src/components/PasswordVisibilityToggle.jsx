import { Eye, EyeOff } from 'lucide-react';

const PasswordVisibilityToggle = ({ visible, onToggle }) => (
  <button
    type='button'
    onClick={onToggle}
    className='password-toggle'
    aria-label={visible ? 'Hide password' : 'Show password'}
    aria-pressed={visible}>
    {visible ? (
      <EyeOff aria-hidden='true' />
    ) : (
      <Eye aria-hidden='true' />
    )}
  </button>
);

export default PasswordVisibilityToggle;
