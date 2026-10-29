# Recipes

Step-by-step guides for common changes. Each one lists every file you'll need to touch, so nothing gets missed.

## Add a field to `CurrentBridgeState`

1. `bridge-state.types.ts`: add the field to `CurrentBridgeState`. The payload type is derived with `Omit`, so it picks the field up automatically.
2. `repositories/firebase-bridge-state.repository.ts`
   - On read, in both `getCurrentBridgeState` and `subscribeToBridgeState`, normalize the field. Convert any `Timestamp` to `Date` and give a default for documents written before the field existed.
   - On write (`updateCurrentBridgeState`), it's spread in automatically. If the field belongs in history, also add it to the `events` document.
3. `repositories/localStorage-bridge-state.repository.ts`: revive dates in `read()` if the field holds a `Date`.
4. `hooks/use-update-bridge-state.ts`: add it to `UpdateBridgeStateParams` and pass it through, or set it from context the way `sourceType` is set.
5. `bridge-state-editor/bridge-state-editor.tsx` and `-form.tsx`: add it to `initialState` and add a labelled control.
6. `simulations/components/simulation-playback.tsx` → `buildFrame`: give it a value so playback frames still type-check. Add it to `SimulationEvent` too if simulations should be able to script it.
7. Show it in the experience with `useBridgeStateExperience()`.
8. Update [domain-model.md](./domain-model.md).

## Add a new traffic or position value

1. Add it to the `BRIDGE_TRAFFIC` or `BRIDGE_POSITION` const. The array and the union type update on their own.
2. For traffic, the `TRAFFIC_CONFIG` entry is required and the compiler will point to it. Choose `weight` (severity) and `speed`.
3. For a position, handle it in `BridgeStateOverview.getTrafficSummary`, `BridgeStatusVisualizer.renderScene`, `getBridgeSceneSummary`, the editor's `canEditEstimatedWaitTime` and `getEffectiveTraffic`, and the generator's `canSetEstimatedWait`.
4. Search for `BRIDGE_POSITION.` and `BRIDGE_TRAFFIC.` to find every comparison.

## Add a repository method

1. Add the signature to the interface in `<feature>.repository.ts`.
2. Implement it in **both** `firebase-*.repository.ts` and `localStorage-*.repository.ts`. In Firebase, wrap it in try/catch with `logError` and re-throw. In `localStorage`, read, change, then write.
3. Add a pass-through in `<feature>.service.ts` and add it to the exported service object.
4. Add a hook in `hooks/` that follows the read or mutation pattern in [patterns.md](./patterns.md#hooks).

## Add a new feature module

Copy the layout of `src/features/simulations/`:

```txt
src/features/<feature>/
├── <feature>.types.ts
├── <feature>.repository.ts          # interface + get<Feature>Repository() using getBridgeDataSource()
├── <feature>.service.ts
├── repositories/firebase-<feature>.repository.ts
├── repositories/localStorage-<feature>.repository.ts
├── hooks/use-<...>.ts
└── components/<...>.tsx
```

- Add the Firestore collection name to `src/lib/firebase/collections.ts`.
- Pick a `localStorage` key that doesn't clash with `bridge-state`, `bridge-data-source` or `simulations`.
- If records belong to a user, store `createdBy: user.uid` from `useAuthContext()` inside the mutation hook.

## Add an admin page

1. Create `src/app/admin/(protected)/<name>/page.tsx` with `"use client"` and a default export. The `(protected)` layout already handles the auth gate, and `app/admin/layout.tsx` provides `AuthProvider`.
2. Keep the page thin and put the UI in `features/`.
3. To read a dynamic segment on the client, use `useParams<{ id: string }>()` from `next/navigation`.
4. Link to it with `next/link` from the dashboard. The Navbar currently has no links.

## Add a public page

Create `src/app/<name>/page.tsx`. There's no `AuthProvider` outside `/admin`, so **don't** call `useAuthContext()` here. Check `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` and `14-metadata-and-og-images.md` for Next 16 metadata conventions.

## Add a 3D scene or prop

1. Put reusable primitives in `src/components/3D/<Name>.tsx`, with a position tuple, a color and optional numbers that have defaults.
2. Put scenes in `features/bridge-state/components/bridge-status-visualizer/bridge-<name>-scene.tsx`. Each one gets its own `<Canvas aria-hidden="true">`, lights and fixed-height container, and takes a `reduceMotion` prop.
3. Every `useFrame` animation must return early when `reduceMotion` is set.
4. Add the scene to `renderScene` and give it a sentence in `getBridgeSceneSummary` for screen readers.
5. Take colors from `TRAFFIC_CONFIG` when they mean something about traffic.

## Prepare for device (Pi) writes

This isn't built yet. If you're asked to start on it:

- The device should write the **same `CurrentBridgeStatePayload` shape** with `sourceType: "device"`, a stable `sourceId`, real confidence values from 0 to 1, and the invariants in [domain-model.md](./domain-model.md#invariants).
- Respect `acceptsDeviceUpdates`. Admin writes set it to `false` so that a manual override wins. Decide how and when it goes back to `true`, which nothing does today.
- The Firebase update uses `batch.update` on `bridgeState/current`, which fails if the document doesn't exist. Either seed the document or switch to `set(..., { merge: true })`.
- A server-side ingestion endpoint, such as a Next route handler using the Firebase Admin SDK, would be a new layer. Read the Next 16 route handler docs first and keep secrets out of `NEXT_PUBLIC_*`.

## Before you open a PR

- [ ] `npx eslint` passes with no new warnings
- [ ] `npx tsc --noEmit` passes
- [ ] Any new repository method exists in **both** the Firebase and `localStorage` repositories
- [ ] The domain invariants still hold, and old documents still load (normalize missing fields)
- [ ] The UI change works in both **Local (Demo)** and **Live** data-source modes, and on mobile width
- [ ] Accessibility: labels, roles, an `sr-only` summary for canvases, and reduced motion respected
- [ ] The docs in `docs/agents/` are updated if you changed a pattern, the domain model or a route
- [ ] The commit message follows Conventional Commits (`feat: ...`, `refactor: ...`)
