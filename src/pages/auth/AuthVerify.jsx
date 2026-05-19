import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Mail, XCircle } from 'lucide-react';
import { BackgroundMesh } from '../../components/layout/BackgroundMesh';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

const LOGIN_PATH = '/login';
const AUTO_REDIRECT_SECONDS = 8;

export default function AuthVerify() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);

  useEffect(() => {
    let mounted = true;

    const finish = async () => {
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : '';
      const hashParams = new URLSearchParams(hash);
      const searchParams = new URLSearchParams(window.location.search);

      const linkError =
        searchParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error');

      if (linkError) {
        if (!mounted) return;
        setStatus('error');
        setMessage(decodeURIComponent(linkError.replace(/\+/g, ' ')));
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 150));

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        if (!mounted) return;
        setStatus('error');
        setMessage(sessionError.message);
        return;
      }

      if (session) {
        await supabase.auth.signOut();
      }

      if (!mounted) return;

      setStatus('success');
      setMessage('Your email address has been verified. You can now sign in to your workspace.');
      window.history.replaceState({}, document.title, '/auth/verify');
    };

    void finish();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (status !== 'success') return undefined;

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          navigate(LOGIN_PATH, { replace: true });
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status, navigate]);

  const goToLogin = () => navigate(LOGIN_PATH, { replace: true });

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundMesh variant="login" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 py-16"
      >
        <div className="w-full rounded-[2rem] border border-white/10 bg-black/50 p-8 text-center shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
          {status === 'loading' && (
            <>
              <motion.div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                <Mail size={28} className="animate-pulse text-cyan-300" />
              </motion.div>
              <h1 className="text-2xl font-semibold text-white">Confirming your email</h1>
              <p className="mt-3 text-sm leading-7 text-zinc-400">Please wait while we verify your link…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <CheckCircle2 size={30} />
              </motion.div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300/90">
                Email verified
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-white">You&apos;re all set</h1>
              <p className="mt-4 text-sm leading-7 text-zinc-400">{message}</p>
              <p className="mt-4 text-xs text-zinc-500">
                Redirecting to sign in in {countdown} second{countdown === 1 ? '' : 's'}…
              </p>
              <Button type="button" className="mt-8 w-full" onClick={goToLogin}>
                Continue to sign in
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <motion.div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
                <XCircle size={30} />
              </motion.div>
              <h1 className="text-2xl font-semibold text-white">Verification link issue</h1>
              <p className="mt-4 text-sm leading-7 text-zinc-400">
                {message || 'This link may have expired or already been used. Request a new confirmation email or sign in.'}
              </p>
              <Button type="button" className="mt-8 w-full" onClick={goToLogin}>
                Go to sign in
              </Button>
            </>
          )}

          <p className="mt-6 text-xs text-zinc-500">
            Need a new account?{' '}
            <Link to="/get-started" className="text-violet-400 hover:text-violet-300">
              Create a workspace
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
