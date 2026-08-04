# BioSync Stack — mobile

Expo (SDK 57) React Native app: an offline-first supplement cabinet with dose
tracking, an on-device interaction rules engine, local reminders, barcode
scanning and affiliate reorder.

This is a native port of the web app in the repository root. The two share no
code at runtime — the domain logic under `src/domain` is a platform-neutral copy
of the web `src/lib` and `src/utils` modules.

## Architecture

```
src/
  app/                  expo-router routes (file-based)
    _layout.tsx         providers, splash, notification scheduling
    (tabs)/             Today · Cabinet · Alerts · Insights · Reorder
    rule-settings.tsx   rules-engine thresholds (Pro)
    scanner.tsx         full-screen barcode scanner (Pro)
    paywall.tsx         RevenueCat paywall (modal)
  domain/               pure TypeScript — no React, no native imports
    supplements.ts      item model, catalog helpers, seed data
    rules-engine.ts     deterministic interaction evaluation
    schedule.ts         block statuses, reminder feed, expiry parsing
    settings.ts         RuleSettings / ReminderSettings defaults
  store/
    persistence.ts      AsyncStorage repository (replaces Dexie/IndexedDB)
    stack-store.tsx     app state, day rollover, mutations
    purchases.tsx       RevenueCat client + entitlement state
    entitlements.ts     what Free gets, what Pro unlocks
  notifications/        expo-notifications scheduling + permission flow
  ui/                   the design system — see docs/UX-UI-AUDIT.md
  features/             composed, non-route components
```

**Everything stays on the device.** There is no backend, no account and no
analytics. The only outbound requests are the ones the user triggers: opening a
merchant page and talking to the store when they buy Pro.

## Running it

```sh
npm install
cp .env.example .env      # fill in RevenueCat keys (optional for UI work)
npm start
```

Expo Go covers most of the app. **In-app purchases will not work in Expo Go** —
`react-native-purchases` is a native module. The paywall detects this and says
so instead of crashing. For purchases, notifications on a real device, and the
camera, build a development client:

```sh
npx eas build --profile development --platform android
```

### Useful scripts

| Script              | What it does                                |
| ------------------- | ------------------------------------------- |
| `npm run typecheck` | `tsc --noEmit` under `strict`               |
| `npm run doctor`    | `expo-doctor` dependency/config validation   |
| `npm run prebuild`  | regenerate `ios/` + `android/` locally      |
| `npm run build:*`   | EAS build for development / preview / prod   |

Icons and the splash mark are generated, not hand-drawn:
`node scripts/generate-assets.mjs`.

## Monetization

RevenueCat, entitlement id `pro`. Gates live in `src/store/entitlements.ts`:

| Feature                             | Free            | Pro |
| ----------------------------------- | --------------- | --- |
| Dose tracking, streaks, reminders   | ✅              | ✅  |
| Cabinet size                        | 8 supplements   | ∞   |
| Interaction insights                | 1 card          | all |
| Rule threshold tuning               | —               | ✅  |
| Barcode scanning                    | —               | ✅  |
| Smart reorder (affiliate)           | ✅              | ✅  |

Reorder is deliberately free — it is the affiliate revenue line, so gating it
would cost money rather than make it.

If the RevenueCat keys are missing, the app runs normally on the free tier and
the paywall explains why purchasing is unavailable. Under `__DEV__` only, the
paywall offers a local "unlock Pro" toggle for testing; it is compiled out of
release builds.

## Before shipping

See [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md) — the placeholders
that must be replaced (bundle ids, Apple team, legal URLs, RevenueCat products)
are listed there.
