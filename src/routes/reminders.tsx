import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BellRing,
  CalendarClock,
  CheckCircle2,
  PackageMinus,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { useStack } from "../lib/stack-store";
import {
  buildReminderFeed,
  formatTime,
  notifyPermission,
  requestNotifyPermission,
  type NotifyPermission,
} from "../lib/reminders";
import { timeBlocks } from "../lib/supplements";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders — BioStack AI" },
      {
        name: "description",
        content:
          "Set on-device dose reminders, low-stock nudges and expiry warnings for your supplement stack.",
      },
      { property: "og:title", content: "Reminders — BioStack AI" },
      {
        property: "og:description",
        content: "Local notifications that keep your protocol on schedule, fully offline.",
      },
    ],
  }),
  component: RemindersPage,
});

const toneClass = {
  emerald: "bg-emerald/10 text-emerald",
  cyan: "bg-cyan/10 text-cyan",
  amber: "bg-amber/10 text-amber",
  crimson: "bg-crimson/10 text-crimson",
} as const;

const kindIcon = {
  dose: CalendarClock,
  stock: PackageMinus,
  expiry: ShieldAlert,
} as const;

function RemindersPage() {
  const { items, reminders, updateReminders, resetReminders } = useStack();
  const [permission, setPermission] = useState<NotifyPermission>("default");

  useEffect(() => setPermission(notifyPermission()), []);

  const feed = buildReminderFeed(items, reminders);
  const enable = async () => {
    const result = await requestNotifyPermission();
    setPermission(result);
    if (result === "granted") toast.success("Reminders enabled on this device");
    else if (result === "denied")
      toast.error("Notifications blocked — enable them in your browser settings");
    else if (result === "unsupported")
      toast.info("This device can't show notifications, in-app nudges still work");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Stay on schedule"
        title="Reminders"
        right={
          <Link
            to="/"
            aria-label="Back to today"
            className="flex size-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
        }
      >
        <p className="text-xs text-muted-foreground">
          Everything runs on this device — no account, no cloud, works offline.
        </p>
      </PageHeader>

      <div className="space-y-4 px-5 py-5">
        {permission !== "granted" ? (
          <section className="rounded-3xl border border-cyan/30 bg-cyan/5 p-4">
            <div className="flex items-start gap-3">
              <BellRing className="mt-0.5 size-5 shrink-0 text-cyan" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Turn on device notifications</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {permission === "denied"
                    ? "Notifications are blocked for this site. Allow them in your browser settings to get dose alerts."
                    : "Get a gentle ping when a block is due, even when the app is in the background."}
                </p>
                {permission !== "denied" ? (
                  <Button onClick={enable} size="sm" className="mt-3">
                    Allow reminders
                  </Button>
                ) : null}
              </div>
            </div>
          </section>
        ) : (
          <p className="flex items-center gap-2 rounded-2xl bg-emerald/10 px-4 py-3 text-xs text-emerald">
            <CheckCircle2 className="size-4" /> Notifications are active on this device.
          </p>
        )}

        <section className="rounded-3xl border border-border/70 bg-card/70 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold">All reminders</p>
              <p className="text-[11px] text-muted-foreground">
                Master switch for doses, stock and expiry
              </p>
            </div>
            <Switch
              checked={reminders.enabled}
              onCheckedChange={(v) => updateReminders({ enabled: v })}
              aria-label="Enable all reminders"
            />
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-border/70 bg-card/70 p-4">
          <p className="text-sm font-semibold">Dose times</p>
          {timeBlocks.map((block) => (
            <div key={block.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <Label htmlFor={`t-${block.key}`} className="text-xs">
                  {block.label}
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Suggested {block.window} · now {formatTime(reminders.times[block.key])}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Input
                  id={`t-${block.key}`}
                  type="time"
                  value={reminders.times[block.key]}
                  onChange={(e) =>
                    updateReminders({ times: { [block.key]: e.target.value } as never })
                  }
                  className="w-[7.5rem]"
                />
                <Switch
                  checked={reminders.blocks[block.key]}
                  onCheckedChange={(v) =>
                    updateReminders({ blocks: { [block.key]: v } as never })
                  }
                  aria-label={`Enable ${block.label} reminder`}
                />
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-5 rounded-3xl border border-border/70 bg-card/70 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Low stock nudges</p>
              <p className="text-[11px] text-muted-foreground">
                Warn me at {reminders.lowStockDays} days of supply
              </p>
            </div>
            <Switch
              checked={reminders.lowStockAlerts}
              onCheckedChange={(v) => updateReminders({ lowStockAlerts: v })}
              aria-label="Enable low stock reminders"
            />
          </div>
          <Slider
            value={[reminders.lowStockDays]}
            min={3}
            max={30}
            step={1}
            onValueChange={([v]) => updateReminders({ lowStockDays: v ?? reminders.lowStockDays })}
            aria-label="Low stock threshold in days"
          />

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Expiry warnings</p>
              <p className="text-[11px] text-muted-foreground">
                Warn me {reminders.expiryLeadDays} days before a bottle expires
              </p>
            </div>
            <Switch
              checked={reminders.expiryAlerts}
              onCheckedChange={(v) => updateReminders({ expiryAlerts: v })}
              aria-label="Enable expiry reminders"
            />
          </div>
          <Slider
            value={[reminders.expiryLeadDays]}
            min={7}
            max={120}
            step={1}
            onValueChange={([v]) => updateReminders({ expiryLeadDays: v ?? reminders.expiryLeadDays })}
            aria-label="Expiry warning lead time in days"
          />
        </section>

        <section className="space-y-2">
          <p className="px-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Coming up
          </p>
          {feed.length === 0 ? (
            <p className="rounded-3xl border border-border/70 bg-card/70 px-4 py-6 text-center text-xs text-muted-foreground">
              Nothing needs your attention. Your stack is fully stocked and logged.
            </p>
          ) : (
            <ul className="space-y-2">
              {feed.map((f) => {
                const Icon = kindIcon[f.kind];
                return (
                  <li
                    key={f.id}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/70 p-3"
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${toneClass[f.tone]}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{f.detail}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{f.when}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Button variant="ghost" className="w-full text-xs" onClick={() => resetReminders()}>
          Reset reminder defaults
        </Button>
        <p className="pb-4 text-center text-[10px] text-muted-foreground">
          Reminder times are stored locally in your device database.
        </p>
      </div>
    </div>
  );
}
