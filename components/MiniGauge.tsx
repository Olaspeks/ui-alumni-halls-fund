/**
 * Flat inline progress bar for the admin table — deliberately not the
 * circular dial, which is reserved for the public page (per the brief's
 * "different job, different look" admin direction).
 */
export default function MiniGauge({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden bg-indigo-100">
        <div className="h-full bg-gold-500" style={{ width: `${clamped}%` }} />
      </div>
      <span className="font-mono text-xs text-ink-500">{clamped}%</span>
    </div>
  );
}
