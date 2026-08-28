import { initials } from '../../lib/tickets/queueMetrics';

const tones = [
  'from-violet-500 to-indigo-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
];

export function UserAvatar({ name, className = '' }) {
  const label = initials(name);
  const tone = tones[label.charCodeAt(0) % tones.length];
  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-white ${tone} ${className}`}
      title={name}
    >
      {label}
    </span>
  );
}
