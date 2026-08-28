export function Sparkline({ values = [], color = '#8b5cf6', className = '' }) {
  const width = 88;
  const height = 36;
  const max = Math.max(1, ...values);
  const points = values
    .map((value, index) => {
      const x = values.length <= 1 ? 0 : (index / (values.length - 1)) * width;
      const y = height - (value / max) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`h-9 w-[88px] ${className}`} aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  );
}
