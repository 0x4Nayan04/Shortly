export const AUTH_PAGE_HANDLES = {
  login: {
    sectionLabel: 'SIGN IN',
    headingId: 'login-heading',
    loadingMessage: 'Loading sign in form',
    skeletonVariant: 'login'
  },
  register: {
    sectionLabel: 'REGISTER',
    headingId: 'register-heading',
    loadingMessage: 'Loading sign up form',
    skeletonVariant: 'register'
  },
  forgotPassword: {
    sectionLabel: 'RESET',
    headingId: 'forgot-heading',
    loadingMessage: 'Loading password reset form',
    skeletonVariant: 'compact'
  },
  resetPassword: {
    sectionLabel: 'NEW PASSWORD',
    headingId: 'reset-heading',
    loadingMessage: 'Loading new password form',
    skeletonVariant: 'login',
    skeletonForgotRow: false
  },
  verifyEmail: {
    sectionLabel: 'VERIFY',
    headingId: 'verify-heading',
    loadingMessage: 'Verifying your email',
    skeletonVariant: 'compact'
  }
};
