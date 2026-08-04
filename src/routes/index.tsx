import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Check, Clock, Croissant, Ban, Plus, Flame } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "../components/PageHeader";
import { ScoreRing } from "../components/ScoreRing";
import { useStack, useStackStats } from "../lib/stack-store";
import { buildBlockStatuses, formatTime, nextBlock } from "../lib/reminders";
import {
  daysOfSupply,
  timeBlocks,
  type Category,
  type TimeOfDay,
} from "../lib/supplements";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today's Stack — BioStack AI" },
      {
        name: "description",
        content:
          "Your daily supplement protocol timeline with morning, afternoon and pre-bed blocks.",
      },
      { property: "og:title", content: "Today's Stack — BioStack AI" },
      {
        property: "og:description",
        content: "Track every dose and keep your protocol consistency above 90%.",
      },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { items, toggleTaken, reminders } = useStack();
  const stats = useStackStats();
  const blocks = buildBlockStatuses(items, reminders);
  const upNext = nextBlock(blocks);
  const [openBlock, setOpenBlock] = useState<TimeOfDay | "none" | null>(null);
  const activeBlock = openBlock ?? upNext?.key ?? "morning";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const logBlock = (key: TimeOfDay) => {
    const pending = items.filter((i) => i.timeOfDay === key && !i.takenToday);
    pending.forEach((i) => toggleTaken(i.id));
    if (pending.length) toast.success(`Logged ${pending.length} dose${pending.length > 1 ? "s" : ""}`);
  };

  return (
    <div>
      <PageHeader
        eyebrow={`${greeting}, Biohacker`}
        title="Today's Protocol"
        right={<ScoreRing value={stats.consistency} label="taken" />}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <p className="min-w-0 text-xs text-muted-foreground">
            {stats.taken} of {stats.total} doses logged · streak{" "}
            <span className="inline-flex items-center gap-1 text-amber">
              <Flame className="size-3" />
              12d
            </span>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/reminders"
              aria-label="Reminders"
              className="flex size-10 items-center justify-center rounded-full border border-border/70 text-muted-foreground"
            >
              <Bell className="size-4" />
            </Link>
            <AddSupplementDialog />
          </div>
        </div>
      </PageHeader>

      <div className="space-y-3 px-5 py-5">
        {upNext ? (
          <section className="rounded-3xl border border-emerald/25 bg-gradient-to-br from-emerald/10 to-cyan/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald">Up next</p>
            <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{upNext.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatTime(upNext.time)} ·{" "}
                  {upNext.total - upNext.done} dose
                  {upNext.total - upNext.done === 1 ? "" : "s"} to log
                </p>
              </div>
              <Button size="sm" className="shrink-0" onClick={() => logBlock(upNext.key)}>
                Log all
              </Button>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-emerald/25 bg-emerald/10 p-4 text-center">
            <p className="text-sm font-semibold text-emerald">Protocol complete for today</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Every scheduled dose is logged. See you tomorrow.
            </p>
          </section>
        )}

        {blocks.map((block) => {
          const blockItems = block.items;
          const done = block.done;
          const open = activeBlock === block.key;
          return (
            <section
              key={block.key}
              className="overflow-hidden rounded-3xl border border-border/70 bg-card/70"
            >
              <button
                onClick={() => setOpenBlock(open ? "none" : block.key)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{block.label}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" /> {formatTime(block.time)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    block.complete
                      ? "bg-emerald/15 text-emerald"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done}/{blockItems.length}
                </span>
              </button>


              {open ? (
                <ul className="space-y-2 px-3 pb-3">
                  {blockItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface-elevated/60 p-3 animate-fade-in"
                    >
                      <button
                        aria-label={`Mark ${item.name} as taken`}
                        onClick={() => toggleTaken(item.id)}
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                          item.takenToday
                            ? "scale-100 border-emerald bg-emerald text-primary-foreground glow-emerald"
                            : "border-border text-transparent hover:border-emerald/60"
                        }`}
                      >
                        <Check className="size-4" strokeWidth={3} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium ${
                            item.takenToday ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          {item.name}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {item.brand} · {item.dailyDose} pill
                          {item.dailyDose > 1 ? "s" : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-cyan/10 px-2 py-0.5 text-[10px] font-medium text-cyan">
                            {daysOfSupply(item)} days left in cabinet
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            {item.takeWithFood ? (
                              <>
                                <Croissant className="size-3" />
                                {item.note ?? "Take with food"}
                              </>
                            ) : (
                              <>
                                <Ban className="size-3" />
                                {item.note ?? "Empty stomach"}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                  {blockItems.length === 0 ? (
                    <li className="px-2 pb-2 text-xs text-muted-foreground">
                      Nothing scheduled in this block.
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function AddSupplementDialog() {
  const { addItem } = useStack();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [pills, setPills] = useState("60");
  const [time, setTime] = useState<TimeOfDay>("morning");

  const submit = () => {
    if (!name.trim()) return;
    addItem({
      brand: brand || "Custom",
      name,
      category: "general" as Category,
      totalPills: Number(pills) || 60,
      remainingPills: Number(pills) || 60,
      dailyDose: 1,
      timeOfDay: time,
      expirationDate: new Date(Date.now() + 500 * 86400000).toISOString(),
      takenToday: false,
      takeWithFood: true,
      affiliateUrl: "https://iherb.com?rcode=BIOSTACK",
      priceEstimate: 24,
    });
    toast.success(`${name} added to your stack`);
    setName("");
    setBrand("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          aria-label="Add supplement"
          className="ml-auto flex size-10 items-center justify-center rounded-full bg-emerald text-primary-foreground glow-emerald"
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[92vw] rounded-3xl border-border bg-card">
        <DialogHeader>
          <DialogTitle>Add supplement</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="s-name">Name</Label>
            <Input
              id="s-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Glycine 3g"
            />
          </div>
          <div>
            <Label htmlFor="s-brand">Brand</Label>
            <Input
              id="s-brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Thorne"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="s-pills">Pill count</Label>
              <Input
                id="s-pills"
                inputMode="numeric"
                value={pills}
                onChange={(e) => setPills(e.target.value)}
              />
            </div>
            <div>
              <Label>Time block</Label>
              <div className="mt-1 flex gap-1">
                {timeBlocks.map((b) => (
                  <button
                    key={b.key}
                    onClick={() => setTime(b.key)}
                    className={`flex-1 rounded-lg px-1 py-2 text-[10px] font-medium capitalize ${
                      time === b.key
                        ? "bg-emerald/15 text-emerald"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {b.key}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} className="w-full">
            Add to stack
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
