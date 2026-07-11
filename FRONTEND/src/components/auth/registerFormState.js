export const registerInitialState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  loading: false,
  error: '',
  verificationPending: false,
  registeredEmail: '',
  resendingVerification: false,
  showPassword: false,
  showConfirmPassword: false
};

export function registerReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, error: '' };
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.value };
    case 'SET_VERIFICATION_PENDING':
      return {
        ...state,
        verificationPending: action.value,
        registeredEmail: action.email || state.email
      };
    case 'SET_RESENDING_VERIFICATION':
      return { ...state, resendingVerification: action.value };
    case 'TOGGLE_PASSWORD':
      return { ...state, showPassword: !state.showPassword };
    case 'TOGGLE_CONFIRM_PASSWORD':
      return { ...state, showConfirmPassword: !state.showConfirmPassword };
    case 'REGISTER_START':
      return { ...state, loading: true, error: '' };
    case 'REGISTER_SUCCESS':
      return {
        ...registerInitialState,
        showPassword: state.showPassword,
        showConfirmPassword: state.showConfirmPassword
      };
    default:
      return state;
  }
}
