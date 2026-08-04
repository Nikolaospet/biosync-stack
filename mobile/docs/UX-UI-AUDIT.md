# UX/UI audit — web library → native design system

The web app was built on shadcn/ui (Radix primitives + Tailwind v4 tokens).
None of that runs on React Native, so the port is not a wrapper: it is a
rebuild of the parts the app actually used, against the same visual language.
This document records what was found, what carried over unchanged, and what was
deliberately changed.

## What the web library actually used

`src/components/ui/` contained 50 shadcn components. The application imported
**seven** of them: Button, Dialog, Input, Label, Slider, Switch and the Sonner
toaster. The other 43 — sidebar, menubar, carousel, command palette, chart,
resizable panels and so on — were dead weight from the scaffold.

The native library therefore implements those seven, plus the four app-specific
components the web app hand-rolled outside `ui/` (PageHeader, ScoreRing,
BottomNav, ScannerOverlay), plus the primitives the phone form factor needs
(Card, Badge, Screen, Sheet, Segmented, ProgressBar, EmptyState, IconButton).
**19 components, all used.**

## Design tokens: carried over exactly

The web `styles.css` defines its palette in oklch. Each token was converted to
sRGB and checked against the hex values the stylesheet documented in comments:

| Token       | Web (oklch)             | Native  | Documented hex |
| ----------- | ----------------------- | ------- | -------------- |
| background  | `0.168 0.017 258`       | #0B0F17 | #0B0F17 ✅      |
| surface     | `0.203 0.019 260`       | #121824 | #121824 ✅      |
| emerald     | `0.696 0.149 162.5`     | #10B981 | #10B981 ✅      |
| cyan        | `0.715 0.129 215.2`     | #06B6D4 | #06B6D4 ✅      |
| amber       | `0.769 0.163 70.1`      | #F59E0B | #F59E0B ✅      |
| crimson     | `0.637 0.208 25.3`      | #EF4444 | #EF4444 ✅      |

Radii (`--radius: 1rem` and its derivatives), the 4pt spacing rhythm and the
emerald/cyan glow treatments all carried over. `alpha()` in `theme.ts` replaces
Tailwind's `/10`, `/15`, `/25` opacity suffixes.

## Problems found in the web UI, fixed in the port

### 1. Type sizes below the platform legibility floor

The web app used `text-[9px]`, `text-[10px]` and `text-[11px]` extensively —
badges, block times, supply counts, the ScoreRing label. Apple's HIG puts the
floor at 11pt and Material at 12sp.

The native ramp starts at **11pt (`micro`)** and moves most of the old 10px
usage to **12pt (`caption`)`**. The hierarchy is unchanged; the bottom of the
ramp simply moved up.

### 2. Touch targets under 44pt

Several controls were far below the minimum:

| Control                          | Web size | Native |
| -------------------------------- | -------- | ------ |
| Dose −/+ steppers (`size-3.5`)   | ~14px    | 44/48pt |
| Delete (trash) icon              | ~16px    | 44/48pt |
| Reorder bundle checkbox          | 24px     | full-row target |
| Time-block pills in the add form | ~28px    | 44/48pt |

`MIN_TOUCH` in `theme.ts` resolves to 44 on iOS and 48 on Android; every
interactive primitive uses it, and `Touchable` adds an 8pt hit slop on top.

### 3. Icon-only buttons with no accessible name

The web nav, header actions and scanner close button were icon-only. Some had
`aria-label`, several did not. `IconButton` makes `label` a **required prop** —
an unlabelled icon button cannot be constructed.

### 4. Toasts invisible to assistive tech

Sonner rendered visually with no live region wired up. The native `ToastProvider`
announces every message through `AccessibilityInfo.announceForAccessibility` and
marks the container `accessibilityRole="alert"`.

### 5. Progress and score indicators unreadable by screen readers

`ScoreRing` was raw SVG with no semantics. It is now a single accessibility node
with `role="progressbar"` and a value, announcing "Consistency: 75 percent"
rather than reading circle elements. `ProgressBar` got the same treatment.

### 6. Fixed `max-w-md` phone layout

The web app hard-coded a 448px column, which on a tablet leaves a narrow strip
in the middle of the screen with everything else empty. `useResponsive()`
replaces it with four breakpoints (compact / regular / wide / expanded), driving
gutters, content width and the sheet presentation. Sheets centre as cards on
tablets instead of stretching; `orientation` is `default`, so landscape works.

### 7. Uncapped OS font scaling

Nothing constrained Dynamic Type. At 200% the fixed-height rows and pill badges
break. The `Text` component honours the user's setting but clamps the multiplier
to **0.9–1.35**, which keeps large-text users supported without destroying the
layout.

### 8. Frosted glass with no native equivalent

`backdrop-filter: blur()` does not exist in React Native. Rather than pull in a
blur dependency for a decorative effect, headers and the tab bar use an opaque
`surface` fill. Text contrast becomes predictable instead of depending on
whatever is scrolling underneath.

## Content changes made for store review

Two things in the web build would not survive an app review, and were changed:

- **Fabricated scan results.** `mockScanResult` returned a hard-coded "Life
  Extension Two-Per-Day Multivitamin" for *any* barcode. The native scanner
  looks the code up in the local catalog and, on a miss, presents it as an
  unknown product for the user to name — it never invents a brand.
- **A fake checkout.** Reorder showed a "Redirecting to…" toast and did
  nothing. It now opens the item's affiliate URL in a real browser session, and
  the affiliate relationship is disclosed on screen.

Also added: a "general wellness guidelines, not medical advice" line on the
rules-engine screen. Health-adjacent apps get asked for this.

## Contrast

Checked against the dark background (#0B0F17) and card (#121824):

Computed, not estimated — the numbers below come from the WCAG 2.1 relative
luminance formula:

| Pair                             | Ratio  | Grade |
| -------------------------------- | ------ | ----- |
| foreground on background         | 17.69  | AAA   |
| foreground on surfaceElevated    | 14.91  | AAA   |
| amber on background              |  8.93  | AAA   |
| cyan on background               |  7.90  | AAA   |
| emerald on background            |  7.56  | AAA   |
| onAccent (#0B0F17) on emerald    |  7.56  | AAA   |
| mutedForeground on background    |  6.67  | AA    |
| mutedForeground on card          |  6.18  | AA    |
| mutedForeground on muted         |  5.29  | AA    |
| crimson on background            |  5.10  | AA    |
| onAccent on crimson              |  5.10  | AA    |

No token pair used for text falls below AA (4.5:1). Reproduce with the snippet
in `docs/` history or any WCAG contrast checker.

## Known gaps

Honest list of what an MVP does not have yet:

- **No OCR.** The web version's expiry OCR relied on an experimental
  `TextDetector` API that effectively never exists. The native scanner reads
  barcodes for real and asks the user to type the expiry date, parsed by the
  same regex. Real OCR needs a vision dependency and a dev build to test.
- **Light theme.** The app is dark-only, as the web design was. The token layer
  supports a second palette when it is wanted.
- **Reduce Motion** is exposed via `prefersReducedMotion()` but only the toast
  animates, so nothing consumes it yet.
- **No automated tests.** The domain layer is pure and easy to test; that is the
  first thing to add after launch.
