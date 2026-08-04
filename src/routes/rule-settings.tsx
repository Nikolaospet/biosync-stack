import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Cpu, RotateCcw } from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "../components/PageHeader";
import { ScoreRing } from "../components/ScoreRing";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { useStack } from "../lib/stack-store";
import type { TimeOfDay } from "../lib/supplements";
import { evaluateStackLocally, localStackScore } from "../utils/rulesEngine";

export const Route = createFileRoute("/rule-settings")({
  head: () => ({
    meta: [
      { title: "Rule Thresholds — BioStack AI" },
      {
        name: "description",
        content:
          "Tune the on-device rules engine: zinc upper limit, mineral spacing, magnesium timing block and which interaction checks run.",
      },
      { property: "og:title", content: "Rule Thresholds — BioStack AI" },
      {
        property: "og:description",
        content: "Customize your local supplement rules and re-evaluate your stack instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RuleSettingsPage,
});

const blocks: TimeOfDay[] = ["morning", "afternoon", "evening"];

const checks = [
  { key: "checkZincCopper", label: "Zinc / Copper competition" },
  { key: "checkD3K2", label: "Vitamin D3 + K2 synergy" },
  { key: "checkZincOverdose", label: "Zinc upper-limit warning" },
  { key: "checkMagnesiumTiming", label: "Magnesium timing" },
] as const;

function RuleSettingsPage() {
  const { items, settings, updateSettings, resetSettings } = useStack();
  const alerts = useMemo(() => evaluateStackLocally(items, settings), [items, settings]);
  const score = localStackScore(alerts, items.length);
  const flagged = alerts.filter((a) => a.severity !== "low").length;

  return (
    <div>
      <PageHeader
        eyebrow="On-Device Rules Engine"
        title="Rule Thresholds"
        right={
          <Link
            to="/insights"
            aria-label="Back to insights"
            className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-card/70 text-muted-foreground transition-colors hover:text-cyan"
          >
            <ArrowLeft className="size-4" />
          </Link>
        }
      />

      <div className="space-y-4 px-5 py-5">
        <section className="flex items-center gap-4 rounded-3xl border border-cyan/25 bg-cyan/5 p-5 glow-cyan">
          <ScoreRing value={score} size={80} stroke={8} tone="cyan" label="live" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan">Live re-evaluation</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {alerts.length} rule{alerts.length === 1 ? "" : "s"} triggered · {flagged} needing
              action. Updates as you drag.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card/70 p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">Zinc upper limit</p>
            <span className="text-sm font-semibold tabular-nums text-cyan">
              {settings.zincLimitMg} mg/day
            </span>
          </div>
          <Slider
            className="mt-4"
            aria-label="Zinc upper limit in milligrams per day"
            min={15}
            max={100}
            step={5}
            value={[settings.zincLimitMg]}
            onValueChange={([v]) => updateSettings({ zincLimitMg: v ?? 45 })}
          />
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Default is the 45mg tolerable upper intake level. Raise it if you cycle high-dose zinc
            deliberately.
          </p>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card/70 p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">Mineral spacing</p>
            <span className="text-sm font-semibold tabular-nums text-cyan">
              {settings.copperSpacingHours} h
            </span>
          </div>
          <Slider
            className="mt-4"
            aria-label="Minimum hours between competing minerals"
            min={1}
            max={12}
            step={1}
            value={[settings.copperSpacingHours]}
            onValueChange={([v]) => updateSettings({ copperSpacingHours: v ?? 4 })}
          />
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Minimum gap advised between minerals sharing a transporter.
          </p>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card/70 p-4">
          <p className="text-sm font-semibold">Preferred magnesium block</p>
          <div className="mt-3 flex gap-2">
            {blocks.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => updateSettings({ magnesiumBlock: b })}
                className={`flex-1 rounded-2xl border px-2 py-2 text-[11px] font-semibold capitalize transition-colors ${
                  settings.magnesiumBlock === b
                    ? "border-cyan/40 bg-cyan/10 text-cyan"
                    : "border-border/70 text-muted-foreground"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card/70 p-4">
          <p className="text-sm font-semibold">Active checks</p>
          <ul className="mt-2 divide-y divide-border/60">
            {checks.map(({ key, label }) => (
              <li key={key} className="flex items-center justify-between gap-3 py-3">
                <span className="text-[12px] text-muted-foreground">{label}</span>
                <Switch
                  aria-label={label}
                  checked={settings[key]}
                  onCheckedChange={(checked) => updateSettings({ [key]: checked })}
                />
              </li>
            ))}
          </ul>
        </section>

        <button
          type="button"
          onClick={resetSettings}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card/60 py-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          Reset to clinical defaults
        </button>

        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/60 px-3 py-2 text-[11px] text-muted-foreground">
          <Cpu className="size-3.5 shrink-0 text-emerald" />
          Thresholds are stored in this device's local database and applied instantly — nothing is
          uploaded.
        </div>
      </div>
    </div>
  );
}
