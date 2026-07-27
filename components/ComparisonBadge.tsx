import clsx from "clsx";
import { ArrowDown, ArrowUp, Check } from "lucide-react";

export default function ComparisonBadge({ diferencia }: { diferencia: number }) {
  if (diferencia === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-ok/10 px-2.5 py-1 text-xs font-medium text-ok">
        <Check size={12} /> Exacto
      </span>
    );
  }

  const faltante = diferencia < 0;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        faltante ? "bg-chilli/15 text-chilli-light" : "bg-warn/15 text-warn"
      )}
    >
      {faltante ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
      {faltante ? `Faltan ${Math.abs(diferencia)}` : `Sobran ${diferencia}`}
    </span>
  );
}
