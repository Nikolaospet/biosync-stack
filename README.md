# BioSync Stack

An offline-first supplement cabinet: dose tracking, an on-device interaction
rules engine, local reminders, barcode scanning and affiliate reorder.

The repository holds two applications.

| Path      | What it is                                                        |
| --------- | ----------------------------------------------------------------- |
| `src/`    | The original web app — TanStack Start + React + Tailwind (Lovable) |
| `mobile/` | The native app — Expo SDK 57 + React Native, built for App Store and Play |

They share no runtime code. The mobile app carries a platform-neutral copy of
the domain logic (`mobile/src/domain`) ported from the web `src/lib` and
`src/utils`; everything else — storage, UI, navigation, notifications — is
native.

## Mobile (the shipping app)

```sh
cd mobile
npm install
npm start
```

- [`mobile/README.md`](mobile/README.md) — architecture and scripts
- [`mobile/docs/UX-UI-AUDIT.md`](mobile/docs/UX-UI-AUDIT.md) — how the shadcn/Tailwind design system was rebuilt natively, and the accessibility issues fixed along the way
- [`mobile/docs/LAUNCH-CHECKLIST.md`](mobile/docs/LAUNCH-CHECKLIST.md) — what remains before a store submission

Monetization is RevenueCat (`react-native-purchases`) with a `pro` entitlement.
The app runs fine without keys configured — it just stays on the free tier.

## Web

```sh
npm i
npm run dev
```

Built with TanStack Start, TypeScript, React and Tailwind CSS. Connected to
[Lovable](https://lovable.dev); commits pushed to the connected branch sync back
into the editor.

## Privacy

Neither app has a backend, an account system or analytics. All state lives on
the device — IndexedDB on web, AsyncStorage on mobile. The only outbound
requests are ones the user initiates: opening a merchant page, and talking to
the app store when buying Pro.
