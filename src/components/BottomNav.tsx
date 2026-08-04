import { Link } from "@tanstack/react-router";
import { Bell, CalendarCheck, Package, Sparkles, ShoppingCart } from "lucide-react";

const tabs = [
  { to: "/", label: "Today", icon: CalendarCheck },
  { to: "/cabinet", label: "Cabinet", icon: Package },
  { to: "/reminders", label: "Alerts", icon: Bell },
  { to: "/insights", label: "AI", icon: Sparkles },
  { to: "/reorder", label: "Reorder", icon: ShoppingCart },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 glass pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary"
              activeProps={{ className: "bg-primary/10" }}
            >
              <Icon className="size-5" strokeWidth={2} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
