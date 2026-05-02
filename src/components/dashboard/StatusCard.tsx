type StatusCardProps = {
  label: string;
  value: string;
  hint: string;
};

export function StatusCard({ label, value, hint }: StatusCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-panel backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sand-300/70">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-sand-200/75">{hint}</p>
    </article>
  );
}
