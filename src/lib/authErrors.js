/**
 * Maps Supabase Auth errors to user-friendly messages.
 */
const AUTH_ERROR_MESSAGES = {
  invalid_credentials: 'Invalid email or password. Please try again.',
  invalid_login_credentials: 'Invalid email or password. Please try again.',
  email_not_confirmed: 'Please confirm your email before signing in.',
  user_already_registered: 'An account with this email already exists. Try signing in.',
  signup_disabled: 'Sign up is currently disabled. Contact your administrator.',
  weak_password: 'Password must be at least 6 characters.',
  over_request_rate_limit: 'Too many attempts. Please wait a moment and try again.',
  same_password: 'New password must be different from your current password.',
};

export function getAuthErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.';

  const code = error.code?.toLowerCase?.() ?? '';
  const message = error.message?.toLowerCase?.() ?? '';

  if (AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }

  if (message.includes('invalid login credentials')) {
    return AUTH_ERROR_MESSAGES.invalid_login_credentials;
  }
  if (message.includes('email not confirmed')) {
    return AUTH_ERROR_MESSAGES.email_not_confirmed;
  }
  if (message.includes('user already registered')) {
    return AUTH_ERROR_MESSAGES.user_already_registered;
  }
  if (message.includes('password')) {
    return AUTH_ERROR_MESSAGES.weak_password;
  }
  if (message.includes('rate limit')) {
    return AUTH_ERROR_MESSAGES.over_request_rate_limit;
  }

  return error.message || 'Something went wrong. Please try again.';
}
