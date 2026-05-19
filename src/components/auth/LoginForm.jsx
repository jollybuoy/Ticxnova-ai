import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { MicrosoftLogo } from './MicrosoftLogo';
import { AuthAlert } from './AuthAlert';
import { useAuth } from '../../hooks/useAuth';

const MODES = {
  signin: 'signin',
  signup: 'signup',
  reset: 'reset',
};

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, signInWithMicrosoft, resetPassword, actionLoading } = useAuth();

  const [mode, setMode] = useState(MODES.signin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const redirectState = location.state;
    if (!redirectState) return;

    if (redirectState.email) {
      setEmail(redirectState.email);
    }
    if (redirectState.message) {
      setSuccess(redirectState.message);
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const isSignIn = mode === MODES.signin;
  const isSignUp = mode === MODES.signup;
  const isReset = mode === MODES.reset;

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    clearMessages();
    if (nextMode !== MODES.signin) {
      setPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (isReset) {
      const result = await resetPassword(email);
      if (result.success) {
        setSuccess(result.message);
      } else {
        setError(result.message);
      }
      return;
    }

    if (isSignUp) {
      const result = await signUp(email, password);
      if (!result.success) {
        setError(result.message);
        return;
      }
      if (result.needsEmailConfirmation) {
        setSuccess(result.message);
        switchMode(MODES.signin);
        return;
      }
      navigate('/dashboard', { replace: true });
      return;
    }

    const result = await signIn(email, password);
    if (!result.success) {
      setError(result.message);
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  const handleMicrosoft = async () => {
    clearMessages();
    const result = await signInWithMicrosoft();
    if (!result.success) {
      setError(result.message);
    }
  };

  const title = isReset ? 'Reset password' : isSignUp ? 'Create account' : 'Sign in';
  const subtitle = isReset
    ? 'We’ll email you a link to reset your password'
    : isSignUp
      ? 'Get started with Ticxnova-AI'
      : 'Access your Ticxnova-AI workspace';

  const submitLabel = isReset ? 'Send reset link' : isSignUp ? 'Create account' : 'Sign in';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <div className="glass-card p-8 sm:p-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
          <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
        </div>

        <AuthAlert
          message={error}
          variant="error"
          onDismiss={() => setError(null)}
        />
        <AuthAlert
          message={success}
          variant="success"
          onDismiss={() => setSuccess(null)}
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Work email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={actionLoading}
          />

          {!isReset && (
            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                disabled={actionLoading}
              />
              {isSignIn && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => switchMode(MODES.reset)}
                    className="text-xs font-medium text-violet-400 transition-colors hover:text-violet-300 disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3"
            disabled={actionLoading}
            loading={actionLoading}
          >
            {submitLabel}
          </Button>
        </form>

        {!isReset && (
          <>
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.08]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-transparent px-3 text-zinc-500">or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="microsoft"
              className="w-full py-3"
              disabled={actionLoading}
              loading={actionLoading}
              onClick={handleMicrosoft}
            >
              <MicrosoftLogo />
              Sign in with Microsoft
            </Button>
          </>
        )}

        <p className="mt-8 text-center text-xs text-zinc-500">
          {isReset ? (
            <>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => switchMode(MODES.signin)}
                className="font-medium text-violet-400 hover:text-violet-300"
              >
                Back to sign in
              </button>
            </>
          ) : isSignUp ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode(MODES.signin)}
                className="font-medium text-violet-400 hover:text-violet-300"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode(MODES.signup)}
                className="font-medium text-violet-400 hover:text-violet-300"
              >
                Create account
              </button>
            </>
          )}
        </p>
      </div>

      <p className="mt-6 text-center text-[11px] text-zinc-600">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </motion.div>
  );
}
