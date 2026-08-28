export function RingGauge({
  value = 0,
  max = 100,
  size = 92,
  stroke = 8,
  color = '#8b5cf6',
  label,
  sublabel,
  display,
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, max ? value / max : 0));
  const dash = circumference * ratio;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-semibold tabular-nums text-white ${size < 56 ? 'text-[11px]' : 'text-lg'}`}>{display ?? value}</span>
        </div>
      </div>
      {label && <p className="text-center text-xs font-medium text-zinc-300">{label}</p>}
      {sublabel && <p className="text-center text-[11px] text-zinc-500">{sublabel}</p>}
    </div>
  );
}
