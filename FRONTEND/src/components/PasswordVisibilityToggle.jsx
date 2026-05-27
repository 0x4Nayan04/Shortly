import { Eye, EyeOff } from 'lucide-react';

const PasswordVisibilityToggle = ({ visible, onToggle }) => (
  <button
    type='button'
    onClick={onToggle}
    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1'
    aria-label={visible ? 'Hide password' : 'Show password'}
    aria-pressed={visible}>
    {visible ? (
      <EyeOff
        className='w-5 h-5'
        aria-hidden='true'
      />
    ) : (
      <Eye
        className='w-5 h-5'
        aria-hidden='true'
      />
    )}
  </button>
);

export default PasswordVisibilityToggle;
