import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ThemeSettings } from '../components/settings/ThemeSettings';
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';
import { getUserEmail } from '../lib/user';

export default function Profile() {
  const { user } = useAuth();
  const { profile, tenant, saveProfile, mutating } = useTenant();

  return (
    <>
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">
          My Account
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Profile</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          View your workspace identity and update your personal details.
        </p>
      </div>

      <ThemeSettings />

      <section className="glass-card max-w-3xl space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" value={profile?.email || getUserEmail(user)} disabled />
          <Input label="Role" value={(profile?.role || 'employee').replaceAll('_', ' ')} disabled />
          <Input label="Organization" value={tenant?.company_name || ''} disabled />
          <Input label="Department" value={profile?.department || ''} disabled />
        </div>

        <Button
          type="button"
          variant="secondary"
          loading={mutating}
          onClick={() => saveProfile({ full_name: profile?.full_name || user?.user_metadata?.full_name || null })}
        >
          Refresh Profile
        </Button>
      </section>
    </>
  );
}
