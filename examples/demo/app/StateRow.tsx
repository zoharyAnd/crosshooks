function toneFor(value: boolean | string): string {
  if (typeof value === 'boolean') return value ? 'pill-true' : 'pill-false';
  if (value === 'granted') return 'pill-true';
  if (value === 'denied') return 'pill-false';
  return 'pill-neutral';
}

/** One `label → value` row in a hook's state panel. */
export function StateRow({ label, value }: { label: string; value: boolean | string }) {
  return (
    <div className="state-row">
      <code>{label}</code>
      <span className={`pill ${toneFor(value)}`}>{String(value)}</span>
    </div>
  );
}
