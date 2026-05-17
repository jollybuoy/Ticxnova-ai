const variants = {
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function Badge({ children, variant = 'blue', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[variant] ?? variants.blue} ${className}`}
    >
      {children}
    </span>
  );
}

export function NavBadge({ count }) {
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
      {count}
    </span>
  );
}
