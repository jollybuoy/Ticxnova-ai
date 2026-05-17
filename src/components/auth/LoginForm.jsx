import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { MicrosoftLogo } from './MicrosoftLogo';

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <div className="glass-card p-8 sm:p-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Sign in</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Access your Ticxnova-AI workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Work email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <div>
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <div className="mt-2 text-right">
              <button
                type="button"
                className="text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full py-3">
            Sign in
          </Button>
        </form>

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
          onClick={() => navigate('/dashboard')}
        >
          <MicrosoftLogo />
          Sign in with Microsoft
        </Button>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link to="/dashboard" className="font-medium text-violet-400 hover:text-violet-300">
            Request access
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-[11px] text-zinc-600">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </motion.div>
  );
}
