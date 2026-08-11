function toneFor(value: boolean | string): string {
  if (typeof value === 'boolean') {
    return value
      ? 'bg-emerald-400/15 text-[#34d399]'
      : 'bg-slate-500/[0.18] text-[#64748b]';
  }
  if (value === 'granted') return 'bg-emerald-400/15 text-[#34d399]';
  if (value === 'denied') return 'bg-slate-500/[0.18] text-[#64748b]';
  return 'bg-[#6ea8fe]/15 text-[#6ea8fe]';
}

/** One `label → value` row in a hook's state panel. */
export function StateRow({ label, value }: { label: string; value: boolean | string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#263050] bg-[#0f1526] px-3.5 py-3 font-mono text-sm">
      <code>{label}</code>
      <span
        className={`rounded-full px-2.5 py-[3px] text-[13px] font-semibold ${toneFor(value)}`}
      >
        {String(value)}
      </span>
    </div>
  );
}
