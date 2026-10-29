# Known Gaps and Gotchas

Read this before you assume something works. Each item says where in the code it lives. Don't fix these as a side effect of an unrelated task. Mention them, or fix them in a dedicated change.

## Security and access

- **The admin gate only runs in the browser.** `(protected)/layout.tsx` redirects in the browser, and simulation ownership is also checked in the browser (`SimulationPlayback`, `listSimulationsForUser`). There are **no Firestore security rules in this repo**, so all real protection depends on rules set in the Firebase console. Anyone holding the public client config can call Firestore directly.
- **Simulation lists are filtered in the browser.** `firebaseSimulationRepository.listSimulationsForUser` fetches **every** simulation ordered by `createdAt`, then filters by `createdBy` in JavaScript. It should use `where("createdBy", "==", userId)`, plus a composite index if it keeps the ordering.

## Data

- **`bridgeState/current` must already exist.** The Firebase write uses `batch.update`, which fails on a missing document. A new Firebase project needs this document seeded by hand.
- **The `BridgeStateEvent` type is out of date.** It has a single `traffic`/`trafficConfidence` field, but north/south fields are what get written. Nothing reads `events` yet.
- **Local mode writes no events.** The `localStorage` repository only stores the current state.
- **The data source is per browser.** "Local (Demo)" is stored in `localStorage["bridge-data-source"]`. It changes only the admin's browser, never what the public sees.
- **`acceptsDeviceUpdates` isn't used.** It's written as `false` by admin updates, and nothing reads it or sets it back to `true`.
- **Simulations follow the bridge data-source toggle.** There's no separate switch. Simulations saved in Local mode don't appear in Live mode, and the other way round.

## Product

- **There's no edge or device integration yet.** The `device` source type exists, but nothing writes it.
- **The Navbar has a placeholder "Install App" button** with no handler, and there's no PWA manifest or service worker. The Navbar has no links (the About link was removed).
- **Dark mode is turned off.** The `prefers-color-scheme` block in `globals.css` is commented out.
- `BridgeStatusCard` and parts of the dashboard use deliberately plain admin styling, including inline `style={{ maxWidth: "768px" }}` and `<br />` spacers.

## Engineering

- **There are no tests and no CI.** The only checks are `npx eslint` and `npx tsc --noEmit`. Adding Vitest with React Testing Library, plus a GitHub Actions workflow running lint, types and build, would be a valuable first step. Pure functions are the easiest to test first: `buildFrame` and `findActiveEvent` in `simulation-playback.tsx`, `getWorstTraffic` and the headline logic in `BridgeStateOverview`, the confidence thresholds in `TrafficCard`, and the `normalize*` functions in the repositories.
- **Formatting isn't enforced.** Files mix 2-space, 4-space and tab indentation. Don't reformat files you aren't otherwise changing, because it buries the real diff.
- **Some logic is duplicated:** the edge-color calculation (three places), `normalizeEvent` (in both simulation repositories), the default simulation events (`SimulationGenerator` initial state and `resetForm`), and the `toDate` helpers. These are fine candidates for a dedicated refactor.
- **`usePrefersReducedMotion` lives inside `bridge-status-visualizer.tsx`.** Move it somewhere shared before reusing it.
- **`window.confirm`** is used when deleting a simulation. It works, but it's a blocking native dialog.
- The README covers the product and setup. These agent docs cover the code conventions. Keep both accurate when things change.
