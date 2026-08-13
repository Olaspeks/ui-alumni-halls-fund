/**
 * One small, explicitly-labeled badge — used for both "Goal reached"
 * and the top-3 "#1"/"#2"/"#3" rank labels, deliberately sharing the
 * exact same visual treatment so the two badge types read as one
 * consistent system rather than two different things. No per-rank
 * color-coding (gold/silver/bronze) — identical apart from the label
 * text, so nothing about a badge's own color introduces ambiguity
 * about what it means.
 */
export default function TubeBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-indigo-950 px-1.5 py-0.5 text-[9px] font-bold leading-none tracking-wide text-gold-300 shadow-sm">
      {label}
    </span>
  );
}
