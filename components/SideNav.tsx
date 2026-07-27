"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Beer, GlassWater, IceCreamCone, Boxes, Users, ClipboardList, FileBarChart } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, enabled: true },
  { href: "/cerveza", label: "Cerveza", icon: Beer, enabled: true },
  { href: "/barra", label: "Barra", icon: GlassWater, enabled: false },
  { href: "/postres", label: "Postres", icon: IceCreamCone, enabled: false },
  { href: "/material", label: "Material", icon: Boxes, enabled: false },
  { href: "/personal", label: "Personal", icon: Users, enabled: false },
  { href: "/checklists", label: "Checklists", icon: ClipboardList, enabled: false },
  { href: "/reportes", label: "Reportes", icon: FileBarChart, enabled: false },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-base-800 bg-base-900/60 backdrop-blur-sm px-4 py-6">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="h-8 w-8 rounded-lg bg-chilli shadow-glow flex items-center justify-center font-display font-bold text-sm">
          CW
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-none text-white">Chilli Wings</p>
          <p className="text-[11px] text-neutral-500 leading-none mt-1">Manager Pro</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon, enabled }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={enabled ? href : "#"}
              aria-disabled={!enabled}
              className={clsx(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-chilli/15 text-white shadow-glow"
                  : enabled
                  ? "text-neutral-400 hover:bg-base-800 hover:text-neutral-100"
                  : "text-neutral-600 cursor-not-allowed"
              )}
            >
              <Icon size={17} strokeWidth={2} className={active ? "text-chilli-light" : ""} />
              <span>{label}</span>
              {!enabled && (
                <span className="ml-auto text-[10px] uppercase tracking-wide text-neutral-600">
                  pronto
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 text-[11px] text-neutral-600">
        Fase 1 · Dashboard + Cerveza
      </div>
    </aside>
  );
}
