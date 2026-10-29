# Patterns and Conventions

These are the patterns the code already uses. Follow them unless a task explicitly asks you to change one.

## 1. Repository → Service → Hook → Component

```txt
types ─► Repository interface ─► firebase-*.repository.ts ┐
                                localStorage-*.repository.ts ┘─► getXRepository()  (picks by data source)
                                                                    │
                                                              xService  (thin facade)
                                                                    │
                                                              use-*.ts hooks (React state)
                                                                    │
                                                              components
```

### Repository interface + selector

The interface and the selector live together in `<feature>.repository.ts`:

```ts
export interface BridgeStateRepository {
  getCurrentBridgeState(): Promise<CurrentBridgeState | null>;
  subscribeToBridgeState(callback: (s: CurrentBridgeState | null) => void, onError?: (e: Error) => void): () => void;
  updateCurrentBridgeState(update: CurrentBridgeStatePayload): Promise<void>;
}

export function getBridgeStateRepository(): BridgeStateRepository {
  return getBridgeDataSource() === "local" ? localStorageBridgeStateRepository : firebaseBridgeStateRepository;
}
```

Rules:

- Implementations are **object literals typed with the interface**, e.g. `export const firebaseXRepository: XRepository = { async method() {...} }`. They aren't classes.
- Name the files `repositories/firebase-<feature>.repository.ts` and `repositories/localStorage-<feature>.repository.ts`. The `localStorage` part is camelCase, which is the one exception to kebab-case filenames.
- **Both implementations must exist and behave the same way**: same return shapes, same `null` for "not found", same `Date` conversion.
- Subscriptions return an **unsubscribe function**. They take an `onError` callback, and the Firebase version passes `onSnapshot` errors to it.
- Firebase methods wrap their work in `try { ... } catch (error) { logError("FirebaseXRepo", "Failed to ...", error); throw error; }`. They log, then **re-throw**.
- Convert data at the edge. Firestore `Timestamp` and `localStorage` ISO strings become `Date`. Missing fields get defaults through a `normalizeX()` function (see `normalizeEstimatedWaitTime`, `normalizeSimulation` and `normalizeEvent`).
- Use `serverTimestamp()` for `createdAt` and `updatedAt` in Firestore, and `new Date()` in `localStorage`.
- Use `writeBatch` when one action writes to more than one document, as in "update current state and append an event".

### Service

A service is a plain object of arrow functions. Each function calls `getXRepository()` **every time** so it always uses the current data source:

```ts
const updateCurrentBridgeState = async (update: CurrentBridgeStatePayload) =>
  getBridgeStateRepository().updateCurrentBridgeState(update);

export const bridgeStateService = { getCurrentBridgeState, subscribeToBridgeState, updateCurrentBridgeState };
```

Services are where cross-cutting logic belongs, such as validation, deriving fields or calling two repositories. Today they only pass calls through. The auth service is called `authClient` and wraps Firebase Auth directly, because it has no repository.

### Hooks

Hooks live in `features/<feature>/hooks/use-<verb>-<noun>.ts` and return a plain object.

**Read hooks** return `{ data, loading, error }`, and sometimes `refresh` as well:

```ts
const { data, loading, error } = useBridgeState();
```

**Mutation hooks** return `{ <action>, <verb>ing, error }`:

```ts
const { updateBridgeState, updating, error } = useUpdateBridgeState();
const { createSimulation, creating } = useCreateSimulation();
const { deleteSimulation, deleting } = useDeleteSimulation();
```

How a mutation hook behaves:

- If the action needs a user, read it from `useAuthContext()` and **throw** `new Error("You must be logged in to ...")` before doing anything.
- Use `setX(true)`, `setError(null)`, `try { await service... } catch (e) { setError(toError(e, "Fallback.")); throw ...; } finally { setX(false) }`.
- **Re-throw** the error so the calling component can show its own message.
- Hooks fill in fields that come from the context, such as `sourceId: user.uid`, `sourceType: "admin"`, confidence `1.0` and `createdBy`. Components only pass the values the user chose.

Both `export const useX = () => {}` and `export function useX() {}` appear in the code. Match the feature you're working in: `bridge-state` and `auth` mostly use `const`, and `simulations` uses `function`.

## 2. Errors (`src/lib/errors.ts`)

| Helper | Use |
| --- | --- |
| `logError(scope, message, error)` | `console.error("[scope] message", error)`. Used in repositories and services before re-throwing. |
| `toError(unknown, fallback)` | Turns an `unknown` caught value into an `Error`. Used when storing errors in hook state. |
| `errorMessage(unknown, fallback)` | Turns an `unknown` into a string for the UI. Used in components that set `submitError`. |

Components that submit forms keep a local `submitError` string, wrap the mutation in `try/catch`, and render `{submitError ? <p role="alert" className="text-sm text-red-600">{submitError}</p> : null}`.

## 3. React 19 lint rules you will hit

`eslint-config-next` 16 turns on `eslint-plugin-react-hooks` v7, which includes `set-state-in-effect`, `set-state-in-render`, `refs`, `purity`, `immutability` and `static-components`. The codebase uses specific patterns to pass these rules. Use them instead of disabling a rule.

**Resetting state when an input changes: adjust during render, not in an effect.** From `use-bridge-state.ts`:

```ts
const [prevSource, setPrevSource] = useState(source);
if (source !== prevSource) {
  setPrevSource(source);
  setLoading(true);
  setData(null);
  setError(null);
}
```

**Async loads: a result object tagged with its inputs, with `loading` derived from it.** From `use-simulation.ts` and `use-simulations.ts`:

```ts
const [result, setResult] = useState({ simulationId: null, source, data: null, error: null });

useEffect(() => {
  if (!simulationId) return;
  let cancelled = false;
  simulationService.getSimulation(simulationId)
    .then((s) => { if (!cancelled) setResult({ simulationId, source, data: s, error: null }); })
    .catch((e) => { if (!cancelled) setResult({ simulationId, source, data: null, error: toError(e, "...") }); });
  return () => { cancelled = true; };
}, [simulationId, source]);

return {
  data: simulationId ? result.data : null,
  loading: Boolean(simulationId && (result.simulationId !== simulationId || result.source !== source)),
  error: simulationId ? result.error : null,
};
```

Setting state is fine **inside subscription callbacks and timers**, as in the `onSnapshot` callback, `setInterval` and `requestAnimationFrame`. It is not fine to call it synchronously at the top of an effect body.

Other rules to follow:

- Use `useState(() => Date.now())` for the starting "now", then tick it with an interval. Don't call `Date.now()` directly while rendering.
- Keep "latest value" refs current inside effects, as `latestState.current = state` does in `BridgeStatusVisualizer`. Don't write to them during render.
- In R3F, freeze the first color or opacity with `const [initial] = useState(value)` and move toward the target inside `useFrame`. Don't recreate materials when props change.

## 4. Context

- There are two contexts. **`AuthProvider`** (`features/auth/components/auth-provider.tsx`) provides `{ user, loading }` and wraps `/admin/*` in `app/admin/layout.tsx`. **`BridgeStateExperienceProvider`** provides the `CurrentBridgeState` being shown.
- Each context has a `useX()` accessor. The experience accessor **throws** when it's used outside its provider:

  ```ts
  if (!state) throw new Error("useBridgeStateExperience must be used within BridgeStateExperienceProvider.");
  ```

- Components inside the experience read state with `useBridgeStateExperience()`. They don't take it as props and don't fetch it.
- `useAuthContext()` only works under `/admin`. The public page has no `AuthProvider`.

## 5. Module-level store with subscribe

`bridge-state.store.ts` is a very small store written by hand. It has a module variable, a `listeners` array, `get`/`set`/`subscribe` functions, a `localStorage` mirror and a cross-tab `storage` event listener. It doesn't use Zustand or Redux. If you need another small global value, copy this shape and wrap it in a `useX()` hook that does `useState(get())` and `useEffect(() => subscribe(setX), [])`.

Any code that touches `window` or `localStorage` at module level is guarded with `typeof window !== "undefined"`.

## 6. Types and naming

| Thing | Convention | Example |
| --- | --- | --- |
| Feature files | kebab-case, `<feature>.<role>.ts` | `bridge-state.service.ts`, `simulation.types.ts` |
| Feature components | kebab-case file, PascalCase export | `bridge-status-card.tsx` → `BridgeStatusCard` |
| Shared components | PascalCase file | `components/Navbar.tsx`, `components/3D/TugBoat.tsx` |
| Hooks | `use-*.ts` → `useX` | `use-bridge-state.ts` |
| Enum-like consts | `SCREAMING_SNAKE` object + plural array + derived type | `BRIDGE_TRAFFIC`, `BRIDGE_TRAFFIC_STATES`, `BridgeTraffic` |
| Lookup tables | `Record<UnionType, {...}>` so new union members fail to compile | `TRAFFIC_CONFIG`, `ConfidenceVisuals` |
| Payload types | Derive with `Omit<>` from the entity | `CurrentBridgeStatePayload` |
| Props | `interface XProps` above the component | `interface TrafficCardProps` |
| Component-local constants | `SCREAMING_SNAKE` inside the component or module | `ROAD_LENGTH`, `SCENE_FADE_DURATION` |
| Collection names | `lib/firebase/collections.ts` | `SIMULATIONS_COLLECTION` |

- Components use **named exports**. Next route files (`page.tsx`, `layout.tsx`) use **default exports**.
- Small helper functions go inside the component body, as in `BridgeStateOverview` and `TrafficCard`, or at module scope below the component, as in `getBridgeSceneSummary` and `usePrefersReducedMotion`. Move them to a shared module only once a second place needs them.
- Use `type` imports where they help, e.g. `import { type Mesh } from "three"`.
- `strict` TypeScript is on. Don't use `any`, and narrow `unknown` with the error helpers.

## 7. Pages stay thin

A route file wires a hook to a feature component and handles the loading, error and empty states. Any real UI belongs in `features/`. This is the pattern in `app/page.tsx`. The simulation page uses the same idea with bare `<p>` elements.

```tsx
if (loading) return <main className="pt-20" id="main-content"><p className="text-center" role="status">Loading ...</p></main>;
if (error)   return <main ...><p className="text-center text-red-600" role="alert">Failed to load ...</p></main>;
if (!data)   return <main ...><p className="text-center">No ... available.</p></main>;
return <FeatureComponent ... />;
```

The fixed `Navbar` is 64px tall (`h-16`), so page content starts at `pt-16` or `pt-20`.
