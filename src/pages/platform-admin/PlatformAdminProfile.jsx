import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

export default function PlatformAdminProfile() {
  const { user, updatePassword, actionLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    const result = await updatePassword(password);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    setPassword('');
    setConfirmPassword('');
    toast.success('Super admin password updated.');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300/80">Profile</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Super admin credentials</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Update your platform admin password. Use a strong unique password in production.
        </p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Input label="Email" value={user?.email ?? ''} disabled />
          <Input label="Account type" value="Platform super admin" disabled />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
            disabled={actionLoading}
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={6}
            required
            disabled={actionLoading}
          />
          <Button type="submit" loading={actionLoading}>
            Update password
          </Button>
        </form>
      </section>
    </div>
  );
}
