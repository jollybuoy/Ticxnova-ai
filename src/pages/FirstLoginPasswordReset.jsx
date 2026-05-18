import { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { BackgroundMesh } from '../components/layout/BackgroundMesh';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';

export default function FirstLoginPasswordReset() {
  const { updatePassword } = useAuth();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    const passwordResult = await updatePassword(form.password, {
      must_reset_password: false,
      password_reset_at: new Date().toISOString(),
    });
    if (!passwordResult.success) {
      setLoading(false);
      toast.error(passwordResult.message);
      return;
    }
    setLoading(false);

    toast.success('Password changed. Redirecting to your workspace.');
    window.location.assign('/dashboard');
  };

  return (
    <div className="relative min-h-screen">
      <BackgroundMesh variant="login" />
      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <motion.form
          onSubmit={handleSubmit}
          className="glass-card w-full max-w-lg space-y-6 p-8"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-3 text-violet-200">
              <KeyRound size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Change your password</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Your admin created this account with a temporary password.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100/90">
            For security, create a new password before accessing Ticxnova-AI.
          </div>

          <Input
            label="New Password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
            required
          />

          <Button type="submit" className="w-full" loading={loading}>
            <ShieldCheck size={17} />
            Save New Password
          </Button>
        </motion.form>
      </div>
    </div>
  );
}
