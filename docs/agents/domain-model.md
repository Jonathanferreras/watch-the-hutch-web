# Domain Model

The source of truth for everything below is `src/features/bridge-state/bridge-state.types.ts` and `src/features/simulations/simulation.types.ts`. If this doc and the code disagree, the code wins, so fix the doc in the same PR.

## Enumerations (const objects + derived union types)

Domain enums are written as `as const` objects. Each one also gets an array of its values (used for `<select>` options) and a union type derived from the object:

```ts
export const BRIDGE_POSITION = { CLOSED: "closed", OPENING: "opening", OPEN: "open", CLOSING: "closing", UNKNOWN: "unknown" } as const;
export const BRIDGE_POSITIONS = Object.values(BRIDGE_POSITION);
export type BridgePosition = (typeof BRIDGE_POSITION)[keyof typeof BRIDGE_POSITION];
```

| Const | Values | Meaning |
| --- | --- | --- |
| `BRIDGE_POSITION` | `closed`, `opening`, `open`, `closing`, `unknown` | Physical state of the drawbridge leaves. `closed` = cars can cross. |
| `BRIDGE_TRAFFIC` | `light`, `moderate`, `heavy`, `standstill`, `unknown` | Traffic intensity in **one** direction |
| `BRIDGE_STATE_SOURCE` | `device`, `admin` | Who wrote the state: the Pi (planned) or a signed-in admin |

Compare against the constant, as in `position === BRIDGE_POSITION.OPEN`, not against the string `"open"`. The code mostly does this already, so new code should too.

Plain string-union types that aren't backed by a const: `ConfidenceLevel` (`verified | high | likely | uncertain | unknown`), `TrafficDirection` (`"NorthBound" | "SouthBound"`), `EstimatedWaitTimeStatus` and `WaitTimeRevisionReason`.

## `CurrentBridgeState`

This is the one live record. It's stored at Firestore `bridgeState/current` (`CURRENT_BRIDGE_STATE_ID = "current"`) or at `localStorage["bridge-state"]`.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `"current"` | Always the literal `"current"` |
| `sourceId` | `string` | Admin `uid`, or a device id later |
| `sourceType` | `BridgeStateSource` | `admin` or `device` |
| `position` / `positionConfidence` | `BridgePosition` / `number` | Confidence is **0–1** |
| `northBoundTraffic` / `northBoundTrafficConfidence` | `BridgeTraffic` / `number` | Each direction is tracked independently |
| `southBoundTraffic` / `southBoundTrafficConfidence` | `BridgeTraffic` / `number` | |
| `estimatedWaitTime` | `BridgeEstimatedWaitTime \| null` | Only while the bridge is moving or open |
| `acceptsDeviceUpdates` | `boolean` | Set to `false` by admin writes. Meant to stop the Pi from overwriting a manual override (no code reads it yet). |
| `updatedAt` | `Date` | Firestore `serverTimestamp()` on write, converted to a `Date` on read |

`CurrentBridgeStatePayload = Omit<CurrentBridgeState, "id" | "updatedAt">` is the write shape. Repositories add `id` and `updatedAt` themselves.

### Invariants

These rules are enforced in the UI, not in storage, so any new writer has to respect them too. That includes a future Pi integration.

1. **If the bridge isn't closed, traffic is stopped.** When `position` is anything other than `closed`, each direction must be `standstill` or `unknown`. `BridgeStateEditorForm.getEffectiveTraffic` forces this when you save, and the overview headline shows "Stopped Traffic" for any position that isn't closed or unknown.
2. **Wait time only during an opening.** `estimatedWaitTime` should be non-null only for `opening`, `open` or `closing`. Both the editor and the simulation generator null it out for `closed` and `unknown`.
3. **Confidence is 0–1.** Admin writes and simulation frames always use `1`. The UI shows it as `Math.round(c * 100)%`.
4. **Dates are `Date` objects inside the app.** Repositories turn Firestore `Timestamp` values and `localStorage` ISO strings into `Date` at the edge. Components may still wrap values in `new Date(...)` defensively.

### Confidence → label

The thresholds live in `TrafficCard.getConfidenceVisual`:

| Confidence | Level | Label |
| --- | --- | --- |
| ≥ 0.90 | `verified` | Verified |
| ≥ 0.75 | `high` | High |
| ≥ 0.50 | `likely` | Likely |
| ≥ 0.25 | `uncertain` | Uncertain |
| < 0.25 | `unknown` | Unknown |

### Traffic presentation config

`TRAFFIC_CONFIG` in `bridge-state.constants.ts` is a `Record<BridgeTraffic, { color, label, weight, speed }>`. Use it every time you need to show a traffic value:

| Traffic | Label | Color | Weight (severity / bar count) | Speed (3D flow units/s) |
| --- | --- | --- | --- | --- |
| light | Great | `#21D19F` | 1 | 15 |
| moderate | Moderate | `#FACC15` | 2 | 5 |
| heavy | Heavy | `#F97316` | 3 | 2 |
| standstill | Standstill | `#EF4444` | 4 | 0 |
| unknown | Unclear | `#9CA3AF` | 0 | 0 |

`weight` decides which direction is worse (`BridgeStateOverview.getWorstTraffic`) and how many of the 4 bars light up in a `TrafficCard`. `speed` drives the moving band in `BridgeTrafficFlowScene`. Because the type is a `Record` keyed by `BridgeTraffic`, adding a new traffic value is a compile error until it also has an entry here.

### Headline logic (`BridgeStateOverview`)

| Condition | Headline | Subtitle |
| --- | --- | --- |
| `position === unknown` | "Unclear Traffic" | "Waiting for a reliable bridge update." |
| `opening` / `open` / `closing` | "Stopped Traffic" (red) | Text depends on the position, e.g. "Drawbridge is raised. Please wait." |
| `closed`, directions differ | "Varied Traffic" | Names the worse direction, e.g. "Heavier delays northbound." |
| `closed`, directions equal | "{label} Traffic" | e.g. "Both directions are moving smoothly." |

## `BridgeEstimatedWaitTime`

| Field | Notes |
| --- | --- |
| `status` | `not_applicable` \| `calculating` \| `estimated` \| `unknown`. Admin and simulations use `estimated`. |
| `startedAt` | When the countdown started |
| `initialTotalMinutes` / `estimatedTotalMinutes` | First prediction and current prediction |
| `displayedRemainingMinutes?` / `visualProgressPercent?` | **Optional overrides.** When present, the UI shows them as given. When absent, the UI works them out from `startedAt`, `estimatedTotalMinutes` and the current time. |
| `lastRevisedAt`, `revisionReason` | `initial_prediction` \| `device_update` \| `manual_override` \| `null` |
| `confidence`, `updatedAt` | |

`BridgeEstimatedWaitTimeStatus` updates every 60 seconds and shows the remaining minutes, a progress bar, "Started" and "ETA". The admin editor keeps an existing wait time **as-is** if the minutes haven't changed. That way, saving the form doesn't restart the countdown.

## Event history (`events` collection)

Each Firebase `updateCurrentBridgeState` also writes an event document in the same batch: `id`, `sourceId`, `sourceType`, `position`, `positionConfidence`, north/south traffic and their confidences, `occurredAt` and `createdAt` (server timestamps).

> ⚠️ The exported `BridgeStateEvent` type still has a single `traffic` / `trafficConfidence` field, so it doesn't match what is written. Nothing reads `events` yet. If you start reading it, fix the type first.

The `localStorage` repository doesn't record events.

## Simulations

A simulation is a timed script of bridge states that an admin writes and then plays back through the real public UI.

```ts
type SimulationEvent = {
  id: string;                    // crypto.randomUUID()
  label: string;
  durationSeconds: number;       // ≥ 1, integer
  position: BridgePosition;
  northBoundTraffic: BridgeTraffic;
  southBoundTraffic: BridgeTraffic;
  estimatedWaitMinutes: number | null;                 // total wait for this opening
  estimatedWaitStartRemainingMinutes: number | null;   // remaining at event start
  estimatedWaitEndRemainingMinutes: number | null;     // remaining at event end
};

type Simulation = { id; title; createdBy /* uid */; events: SimulationEvent[]; createdAt: Date; updatedAt: Date };
```

- **Storage:** the Firestore `simulations` collection (created with `addDoc`) or `localStorage["simulations"]`. Simulations follow the same live/local switch as bridge state.
- **Ownership:** `createdBy` is the admin's `uid`. `listSimulationsForUser` and `SimulationPlayback` only show a user their own simulations. This check runs in the browser only.
- **Older data:** both repositories run `normalizeEvent`, which fills in a missing start remaining time from `estimatedWaitMinutes` and a missing end remaining time from the start remaining time. Keep this when you change the shape.
- **Saving (`SimulationGenerator.handleSubmit`):** trims the label, falling back to `Event N`. Rounds duration to at least 1. Clamps wait minutes to at least 1 and remaining minutes to `[0, total]`. Nulls the wait fields for `closed` and `unknown`.

### Playback (`SimulationPlayback`)

- The clock is one `setInterval` that ticks every second. It supports play/pause, previous/next event, jumping to an event, and restart.
- `buildFrame(simulation, elapsedSeconds)` produces a `SimulationFrame`, which is `CurrentBridgeState` plus `simulationEventId`, `simulationEventLabel`, `simulationElapsedSeconds` and `simulationEventElapsedSeconds`.
- Remaining wait time is **interpolated linearly** from start remaining to end remaining across the event. It's passed as `displayedRemainingMinutes` and `visualProgressPercent`, and `startedAt` is set to the matching moment in the past.
- The frame is rendered with `<BridgeStateExperience state={frame}/>`, the same component the public page uses. Any change you make to the public experience shows up in playback automatically.
