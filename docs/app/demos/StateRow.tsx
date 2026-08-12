function toneFor(value: boolean | string): string {
  if (typeof value === 'boolean') {
    return value
      ? 'bg-emerald-400/15 text-success'
      : 'bg-slate-500/[0.18] text-neutral';
  }
  if (value === 'granted') return 'bg-emerald-400/15 text-success';
  if (value === 'denied') return 'bg-slate-500/[0.18] text-neutral';
  return 'bg-accent/15 text-accent';
}

/** One `label → value` row in a hook's state panel. */
export function StateRow({ label, value }: { label: string; value: boolean | string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-inset px-3.5 py-3 font-mono text-sm">
      <code>{label}</code>
      <span
        className={`rounded-full px-2.5 py-[3px] text-[13px] font-semibold ${toneFor(value)}`}
      >
        {String(value)}
      </span>
    </div>
  );
}
