# Architecture

## Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 16.2 App Router | Turbopack is the default. Read `node_modules/next/dist/docs/` before using Next APIs. |
| UI | React 19.2, TypeScript 5 (`strict`) | No React Compiler configured. Lint runs the React Compiler-era `react-hooks` v7 rules (see [patterns.md](./patterns.md#3-react-19-lint-rules-you-will-hit)). |
| Styling | Tailwind CSS 4 via `@tailwindcss/postcss` | There's no `tailwind.config`. Theme tokens live in `src/app/globals.css` under `@theme inline`. |
| 3D | three 0.184, `@react-three/fiber` 9, `@react-three/drei` 10 | `three` is listed in `transpilePackages` in `next.config.ts`. |
| Backend | Firebase 12 client SDK (Auth + Firestore) | Browser SDK only. There's no Admin SDK, no route handlers and no server actions. |
| Lint | ESLint 9 flat config (`eslint.config.mjs`) | Uses `eslint-config-next` core-web-vitals and typescript presets. |
| Hosting | Vercel (target) | |

## Rendering model

The whole app runs on the **client**. Each route's `page.tsx` or `layout.tsx` starts with `"use client"` (except `src/app/layout.tsx` and `src/app/admin/layout.tsx`), and all data comes from Firebase's browser SDK through hooks. There is no server-side data fetching, no caching APIs and no `proxy.ts`.

If you add server-side code, such as a route handler for the Pi to post to or server-side auth, treat it as a new architectural layer. Read the Next 16 docs first, and keep the existing client path working.

## Folder layout

```txt
src/
├── app/                                  # App Router: routes only, thin pages
│   ├── layout.tsx                        # Root shell: Geist fonts, <Navbar/>, globals.css
│   ├── page.tsx                          # "/" public commuter view
│   ├── globals.css                       # Tailwind import + CSS vars/theme
│   └── admin/
│       ├── layout.tsx                    # Wraps all /admin/* in <AuthProvider>
│       ├── login/page.tsx                # "/admin/login" email/password form
│       └── (protected)/                  # Route group (no URL segment)
│           ├── layout.tsx                # Client-side auth gate → redirects to /admin/login
│           ├── dashboard/page.tsx        # "/admin/dashboard"
│           └── simulations/[simulationId]/page.tsx   # "/admin/simulations/:id" playback
├── components/                           # Cross-feature UI (PascalCase filenames)
│   ├── Navbar.tsx
│   └── 3D/                               # Reusable R3F primitives: Bridge, River, TugBoat, DirectionalArrow
├── features/                             # Domain modules (kebab-case filenames)
│   ├── auth/
│   ├── bridge-state/
│   └── simulations/
└── lib/
    ├── errors.ts                         # errorMessage / toError / logError
    └── firebase/                         # sdk.ts (singleton init), auth.ts, db.ts, collections.ts
```

### Inside a feature module

`src/features/bridge-state/` is the reference layout:

```txt
bridge-state/
├── bridge-state.types.ts          # Enums-as-const, types, payload types
├── bridge-state.constants.ts      # Presentation config keyed by domain values (TRAFFIC_CONFIG)
├── bridge-state.repository.ts     # Repository interface + getXRepository() selector
├── bridge-state.store.ts          # Tiny module-level store for the data-source toggle
├── bridge-state.service.ts        # Thin facade over the selected repository
├── repositories/
│   ├── firebase-bridge-state.repository.ts
│   └── localStorage-bridge-state.repository.ts
├── hooks/                         # use-*.ts: React state around service calls
└── components/                    # UI, grouped in sub-folders when a component has parts
```

`simulations/` mirrors this. `auth/` is smaller: it has a service, a provider and a hook, but no repository.

## Imports

`tsconfig.json` maps `@/*` to the **repo root**, so absolute imports include `src`:

```ts
import { errorMessage } from "@/src/lib/errors";
import { Bridge } from "@/src/components/3D/Bridge";
```

Inside a feature, use relative imports such as `../bridge-state.types` and `../../auth/components/auth-provider`. Use `@/src/...` for `lib/`, `components/`, and when an `app/` page imports a feature.

## Routes

| URL | File | Access | What it renders |
| --- | --- | --- | --- |
| `/` | `app/page.tsx` | public | `useBridgeState()` → loading, error or empty state, or `<BridgeStateExperience state={data}/>` |
| `/admin/login` | `app/admin/login/page.tsx` | public | Email/password form → `useAuth().login` → `/admin/dashboard` |
| `/admin/dashboard` | `app/admin/(protected)/dashboard/page.tsx` | signed in | `BridgeDataSourceToggle`, `BridgeStatusCard`, `BridgeStateEditor`, `SimulationGenerator`, Logout |
| `/admin/simulations/[simulationId]` | `app/admin/(protected)/simulations/[simulationId]/page.tsx` | signed in and owner | `useSimulation(id)` → `<SimulationPlayback/>` |

The admin gate in `(protected)/layout.tsx` is **client-side only**. It reads `useAuthContext()`, shows "Loading..." while auth resolves, and calls `router.push("/admin/login")` when there's no user. Any real authorization has to come from Firestore security rules, which aren't in this repo yet. See [known-gaps.md](./known-gaps.md).

Dynamic route params are read on the client with `useParams()` from `next/navigation`. If you convert a page to a Server Component, remember that `params` is a **Promise** in Next 16.

## Data flow

```txt
Firestore doc bridgeState/current ──onSnapshot──┐
                                                ├─► repository.subscribeToBridgeState
localStorage "bridge-state" ──listeners/storage─┘            │
                                                             ▼
                                         bridgeStateService (facade)
                                                             │
                                                  useBridgeState() hook
                                         { data, loading, error }, re-subscribes on source change
                                                             │
                                  app/page.tsx  ─► <BridgeStateExperience state={data}>
                                                     └─ BridgeStateExperienceProvider (context)
                                                         ├─ BridgeStateOverview      (headline + subtitle)
                                                         ├─ BridgeStatusVisualizer   (wait time + 3D scene)
                                                         └─ BridgeTrafficOverview    (2× TrafficCard)
```

Writes go the other way: the admin form calls `useUpdateBridgeState()`, then `bridgeStateService.updateCurrentBridgeState(payload)`, then the repository. In Firebase, that is a `writeBatch` that updates `bridgeState/current` and appends a document to `events`.

`BridgeStateExperience` is **presentation-only**. It takes a `CurrentBridgeState` prop and has no idea where the state came from. Simulation playback reuses it by passing a synthetic frame (see [domain-model.md](./domain-model.md#simulations)). Keep it that way: don't make components inside the experience fetch their own data.

## Data sources: live vs local

`bridge-state.store.ts` holds a module-level `"live" | "local"` value. It's saved to `localStorage["bridge-data-source"]`, synced across tabs with the `storage` event, and exposed through `getBridgeDataSource`, `setBridgeDataSource` and `subscribeToDataSource`.

- `getBridgeStateRepository()` and `getSimulationRepository()` both read this value **on each call**. Services don't cache a repository.
- `useBridgeDataSource()` exposes the value to React. Hooks that read data add `source` to their effect dependencies so they reload when it changes.
- The value is saved **per browser**. Flipping it on the dashboard only changes that browser. Other visitors still see live data.

### Running without Firebase

The admin login needs a real Firebase project. You need the four `NEXT_PUBLIC_FIREBASE_*` values in `.env.local`, and an email/password user created in the Firebase console. Once you're signed in, switch the dashboard to **Local (Demo)**. From then on, bridge state and simulations read and write `localStorage` (`bridge-state`, `simulations`) and never touch Firestore.

## Firebase setup

- `lib/firebase/sdk.ts` sets up the app once (`getApps().length > 0 ? getApp() : initializeApp(config)`) from `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and `NEXT_PUBLIC_FIREBASE_APP_ID`.
- `lib/firebase/db.ts` and `lib/firebase/auth.ts` export the `db` and `auth` singletons. Import those, and never call `getFirestore()` or `getAuth()` anywhere else.
- `lib/firebase/collections.ts` holds the collection names: `bridgeState`, `events` and `simulations`. Add new collection names there.
- `.env*` is gitignored. Never commit config values, even though Firebase client keys are technically public.
