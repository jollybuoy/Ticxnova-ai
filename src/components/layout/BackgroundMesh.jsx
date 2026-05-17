export function BackgroundMesh({ variant = 'dashboard' }) {
  const meshClass = variant === 'login' ? 'mesh-login' : 'mesh-dashboard';
  return (
    <div className={`pointer-events-none fixed inset-0 -z-10 ${meshClass}`} aria-hidden>
      <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
      <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[80px]" />
    </div>
  );
}
