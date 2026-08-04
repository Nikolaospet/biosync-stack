import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Cpu,
  Link2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "../components/PageHeader";
import { ScoreRing } from "../components/ScoreRing";
import { useStack } from "../lib/stack-store";
import { evaluateStackLocally, localStackScore, type RuleAlert } from "../utils/rulesEngine";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "On-Device Stack Insights — BioStack AI" },
      {
        name: "description",
        content:
          "Locally evaluated synergies, timing conflicts and overdose warnings across your supplement stack — zero latency, zero data sent.",
      },
      { property: "og:title", content: "On-Device Stack Insights — BioStack AI" },
      {
        property: "og:description",
        content: "A deterministic rules engine that optimizes absorption entirely on your device.",
      },
    ],
  }),
  component: InsightsPage,
});

const chrono = [
  {
    time: "07:10",
    text: "Get 10 minutes of outdoor light before NMN — cortisol peak improves NAD+ uptake.",
  },
  {
    time: "12:30",
    text: "Pair Omega-3 and CoQ10 with your largest fat-containing meal.",
  },
  {
    time: "16:00",
    text: "Caffeine cutoff. Alpha-GPC after this point can blunt evening melatonin onset.",
  },
  {
    time: "21:30",
    text: "Dim lights, then take Magnesium Glycinate on an empty stomach.",
  },
];

const typeMeta: Record<
  RuleAlert["type"],
  { tag: string; icon: typeof Link2; tone: "emerald" | "amber" | "crimson" | "cyan" }
> = {
  synergy: { tag: "Synergy detected", icon: Link2, tone: "emerald" },
  conflict: { tag: "Absorption conflict", icon: AlertTriangle, tone: "amber" },
  overdose: { tag: "Upper limit exceeded", icon: TriangleAlert, tone: "crimson" },
  timing: { tag: "Timing rule", icon: Timer, tone: "cyan" },
};

const toneClass = {
  emerald: "border-emerald/30 bg-emerald/5 text-emerald",
  amber: "border-amber/30 bg-amber/5 text-amber",
  crimson: "border-crimson/30 bg-crimson/5 text-crimson",
  cyan: "border-cyan/30 bg-cyan/5 text-cyan",
};

function InsightsPage() {
  const { items, settings } = useStack();
  const alerts = useMemo(() => evaluateStackLocally(items, settings), [items, settings]);
  const score = localStackScore(alerts, items.length);
  const actionable = alerts.filter((a) => a.severity !== "low").length;

  return (
    <div>
      <PageHeader
        eyebrow="On-Device Rules Engine"
        title="Stack Insights"
        right={
          <Link
            to="/rule-settings"
            aria-label="Rule settings"
            className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-card/70 text-muted-foreground transition-colors hover:text-cyan"
          >
            <SlidersHorizontal className="size-4" />
          </Link>
        }
      />

      <div className="space-y-4 px-5 py-5">
        <section className="flex items-center gap-4 rounded-3xl border border-cyan/25 bg-cyan/5 p-5 glow-cyan">
          <ScoreRing value={score} size={92} stroke={9} tone="cyan" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan">Stack health</p>
            <p className="mt-1 text-lg font-semibold">
              {score >= 85 ? "Highly Optimized" : score >= 65 ? "Needs Tuning" : "Conflicts Found"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {items.length} compounds analysed · Zn limit {settings.zincLimitMg}mg · {actionable} adjustment
              {actionable === 1 ? "" : "s"} recommended
            </p>
          </div>
        </section>

        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/60 px-3 py-2 text-[11px] text-muted-foreground">
          <Cpu className="size-3.5 shrink-0 text-emerald" />
          Evaluated locally on this device in under a millisecond — no data leaves your phone.
        </div>

        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-cyan" />
          Interaction analysis
        </div>

        <ul className="space-y-3">
          {alerts.map((alert) => {
            const meta = typeMeta[alert.type];
            const tone = alert.severity === "high" ? "crimson" : meta.tone;
            return (
              <li key={alert.id} className={`rounded-3xl border p-4 ${toneClass[tone]}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <meta.icon className="size-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                      {meta.tag}
                    </span>
                  </div>
                  <span className="rounded-full bg-background/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider">
                    {alert.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">{alert.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  {alert.description}
                </p>
                <p className="mt-2 text-[11px] font-medium">→ {alert.actionableStep}</p>
              </li>
            );
          })}
          {alerts.length === 0 ? (
            <li className="rounded-3xl border border-border/70 bg-card/70 p-4 text-xs text-muted-foreground">
              No interactions detected in your current cabinet.
            </li>
          ) : null}
        </ul>

        <section className="rounded-3xl border border-border/70 bg-card/70 p-4">
          <div className="flex items-center gap-2">
            <Sun className="size-4 text-amber" />
            <p className="text-sm font-semibold">Chronobiology plan</p>
          </div>
          <ul className="mt-3 space-y-3">
            {chrono.map((c) => (
              <li key={c.time} className="flex gap-3">
                <span className="w-12 shrink-0 text-[11px] font-semibold tabular-nums text-cyan">
                  {c.time}
                </span>
                <span className="text-[12px] leading-relaxed text-muted-foreground">{c.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
