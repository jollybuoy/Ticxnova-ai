import { BackgroundMesh } from '../layout/BackgroundMesh';
import { Spinner } from '../ui/Spinner';

export function AuthLoadingScreen({ message = 'Loading your workspace…' }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <BackgroundMesh variant="login" />
      <div className="glass-card relative flex flex-col items-center gap-4 rounded-2xl px-10 py-8">
        <Spinner className="h-8 w-8 text-violet-400" />
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
    </div>
  );
}
