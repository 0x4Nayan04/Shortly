export const loginInitialState = {
  email: '',
  password: '',
  loading: false,
  error: '',
  showPassword: false,
  verificationBlocked: false,
  resendingVerification: false
};

export function loginReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, error: '' };
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.value };
    case 'TOGGLE_PASSWORD':
      return { ...state, showPassword: !state.showPassword };
    case 'SET_VERIFICATION_BLOCKED':
      return { ...state, verificationBlocked: action.value };
    case 'SET_RESENDING_VERIFICATION':
      return { ...state, resendingVerification: action.value };
    case 'LOGIN_START':
      return { ...state, loading: true, error: '', verificationBlocked: false };
    case 'LOGIN_SUCCESS':
      return { ...loginInitialState, showPassword: state.showPassword };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}
