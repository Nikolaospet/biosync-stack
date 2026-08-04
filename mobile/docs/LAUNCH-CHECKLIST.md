# Launch checklist

Status of the MVP and everything still standing between it and a store listing.

## Done

- [x] Expo SDK 57 app, `expo-doctor` 20/20 clean
- [x] Android and iOS Metro bundles build (`expo export`)
- [x] `expo prebuild` generates valid native projects; permissions verified
- [x] TypeScript `strict` + `noUncheckedIndexedAccess`, zero errors
- [x] EAS profiles: development / preview / production
- [x] Generated icon, adaptive icon, monochrome icon, splash, favicon
- [x] RevenueCat wired with graceful degradation when unconfigured
- [x] Local notifications with real daily triggers
- [x] Camera barcode scanning with permission and manual-entry fallback
- [x] Offline-first storage, day rollover on foreground
- [x] Accessibility pass (see `UX-UI-AUDIT.md`)

## Placeholders that must be replaced

| Where | What | Currently |
| ----- | ---- | --------- |
| `app.json` | iOS bundle id | `com.alkelabs.biosyncstack` — confirm it matches App Store Connect |
| `app.json` | Android package | `com.alkelabs.biosyncstack` — confirm it matches Play Console |
| `eas.json` | `submit.production.ios` | `REPLACE_WITH_*` for Apple ID, ASC app id, team id |
| `eas.json` | `submit.production.android` | path to the Play service-account JSON |
| `src/app/paywall.tsx` | `TERMS_URL`, `PRIVACY_URL` | `alkelabs.com/biosync/*` — these pages must exist and resolve |
| `.env` | RevenueCat keys | not committed; see `.env.example` |

## Before the first EAS build

1. `npx eas init` — writes the real `extra.eas.projectId` into `app.json`.
2. `npx eas credentials` — provision iOS signing and the Android keystore.
3. `cp .env.example .env` and fill in the RevenueCat publishable keys.
4. `npx eas build --profile preview --platform all` and install on real hardware.

`appVersionSource` is `remote`, so EAS owns the build numbers; do not bump
`buildNumber`/`versionCode` by hand.

## Store configuration

**RevenueCat**
- Create entitlement `pro` (the identifier is hard-coded in `entitlements.ts`).
- Create an offering; the app reads `offerings.current`, so mark it current.
- Attach at least one package. The paywall renders whatever packages exist —
  a monthly and an annual is the usual starting point.
- Connect App Store Connect and Play Console API credentials in RevenueCat.

**App Store Connect**
- Create the in-app subscription products and get them to "Ready to Submit"
  before the first review, or the paywall will show an empty product list.
- Privacy nutrition label: the honest answer is **no data collected**. There is
  no backend, no account and no analytics.
- `ITSAppUsesNonExemptEncryption: false` is already set in `app.json`.

**Play Console**
- Data safety form: no data collected, no data shared.
- The `com.android.vending.BILLING` permission is already declared.

## Content and compliance

- [ ] Health disclaimer is on the rules-engine screen. Consider repeating it in
      the store description — health-adjacent listings get scrutinised.
- [ ] Affiliate disclosure is shown on the Reorder screen. Check it also
      satisfies the FTC wording you use elsewhere.
- [ ] The seeded starter stack ships with real brand names (Thorne, LMNT,
      Nordic Naturals…) and affiliate URLs. **Confirm those affiliate programmes
      are actually active** before shipping, or replace the seed data — the
      links are currently placeholders in the `?rcode=BIOSTACK` form.
- [ ] Screenshots for both stores (6.7" iPhone, 6.5" iPhone, Android phone,
      7"/10" tablet).

## Known gaps, deliberately deferred

- No expiry-date OCR — barcodes scan for real, expiry is typed. See the audit.
- No cloud sync or account. This is a positioning choice, not an omission.
- No automated tests. `src/domain` is pure and is the obvious first target.
- Dark theme only.
