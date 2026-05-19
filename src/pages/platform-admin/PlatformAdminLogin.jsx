import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AuthAlert } from '../../components/auth/AuthAlert';
import { useAuth } from '../../hooks/useAuth';
import {
  checkIsPlatformAdmin,
  touchPlatformAdminLogin,
} from '../../lib/platform-admin/platformAdminService';

export default function PlatformAdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, actionLoading } = useAuth();
  const [email, setEmail] = useState('jollybuoytech@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const redirectReason = location.state?.reason;

  const submit = async (event) => {
    event.preventDefault();
    setError(null);

    const result = await signIn(email.trim(), password);
    if (!result.success) {
      setError(result.message);
      return;
    }

    const { isAdmin } = await checkIsPlatformAdmin();
    if (!isAdmin) {
      setError('This account is not authorized for the Ticxnova platform super admin portal.');
      return;
    }

    await touchPlatformAdminLogin();
    toast.success('Welcome to Ticxnova Super Admin.');
    navigate(location.state?.from || '/admin/dashboard', { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#07070c] px-5 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_45%)]" />

      <div className="relative w-full max-w-md rounded-[2rem] border border-amber-300/15 bg-black/50 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600">
            <Shield size={24} className="text-black" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300/80">Internal only</p>
            <h1 className="text-2xl font-semibold text-white">Ticxnova Super Admin</h1>
          </div>
        </div>

        <p className="mb-6 text-sm leading-7 text-zinc-400">
          Platform command center for workspaces, domains, user lifecycle, and analytics. Use your
          authorized super admin credentials.
        </p>

        {redirectReason === 'not_platform_admin' && (
          <AuthAlert
            message="Signed in, but this account is not registered as a platform super admin."
            variant="error"
          />
        )}

        <AuthAlert message={error} variant="error" onDismiss={() => setError(null)} />

        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Super admin email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={actionLoading}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            disabled={actionLoading}
          />
          <Button type="submit" className="w-full" loading={actionLoading}>
            Enter command center
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Change your password anytime from <span className="text-amber-200">Admin Profile</span> after
          sign-in.
        </p>
      </div>
    </div>
  );
}
