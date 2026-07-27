import clsx from "clsx";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-base-800 bg-base-900/70 p-5 animate-fade-up",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "bad" | "warn";
}) {
  const toneColor =
    tone === "good"
      ? "text-ok"
      : tone === "bad"
      ? "text-chilli-light"
      : tone === "warn"
      ? "text-warn"
      : "text-white";

  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={clsx("mt-2 font-display text-3xl font-semibold", toneColor)}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </Card>
  );
}
