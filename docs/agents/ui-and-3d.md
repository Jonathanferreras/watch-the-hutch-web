# UI, Accessibility and 3D

## Layout of the public experience

`BridgeStateExperience` (`features/bridge-state/components/bridge-state-experience.tsx`):

```txt
<main id="main-content" class="pt-16">
  max-w-6xl grid: 1 column on mobile, [minmax(0,1fr) | 360px] at md and up
  ├─ left:  BridgeStateOverview      → big colored "{X} Traffic" headline + subtitle
  │         BridgeStatusVisualizer   → estimated wait block (if any) + 3D scene (350px tall section)
  └─ right: BridgeTrafficOverview    → two TrafficCards (North/South), overlapping the scene on mobile (-mt-8)
```

Design it for phones first. The public page is meant to be glanced at by commuters.

## Tailwind conventions

- Tailwind 4 has no config file. CSS variables (`--background`, `--foreground`) and `@theme inline` tokens are in `src/app/globals.css`. Dark mode is turned off (that block is commented out).
- Use utility classes for layout and spacing. Colors that come from **domain data**, such as `TRAFFIC_CONFIG[x].color`, are applied with inline `style={{ color }}` or `backgroundColor` because they're runtime hex values. A light tint uses a hex-alpha suffix, as in `` `${color}1A` ``.
- **Public UI** uses soft cards: `rounded-2xl bg-white/95 p-4 shadow-lg shadow-slate-900/10 ring-1 ring-black/5 backdrop-blur-md`, with slate text (`text-slate-950`, `text-slate-500`).
- **Admin UI** uses simpler panels: `rounded-xl border bg-white p-4 shadow-sm`, gray text, a green primary button (`bg-green-600 ... text-white`) and a bordered secondary button.
- Disabled buttons use `disabled:cursor-not-allowed disabled:opacity-60`. Pending labels read "Updating...", "Logging in..." and so on.
- Status colors: success and primary are green-600, errors are `text-red-600`, wait time is red-500 / red-100.

## Accessibility checklist

The codebase has had specific accessibility passes (see the commits `feat: improve accessibility and form semantics...` and `feat: add accessibility support and prefers-reduced-motion handling...`). Keep these properties:

- **Forms:** every input or select has a `<label htmlFor>` with a matching `id`, plus `name`. Use the right `type` and `autoComplete` (`email`, `current-password`). Use `required` where it applies. Buttons always have an explicit `type`.
- **Live status:** loading text uses `role="status"`, errors use `role="alert"`, and the main content is `id="main-content"`.
- **Canvases are decorative.** Every `<Canvas>` has `aria-hidden="true"`. The section around it has an `aria-label` and an `sr-only` paragraph that describes the scene in words (`getBridgeSceneSummary`). A new scene needs both.
- **Progress bars** use `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and a descriptive `aria-label`.
- **Icon-only buttons** have an `aria-label`, for example the playback controls ("Previous event", "Pause simulation"). Toggle buttons have `aria-expanded` and `aria-controls`, as on the Navbar mobile menu.
- **Reduced motion:** see below. CSS transitions also get `motion-reduce:transition-none`.

## Reduced motion

`usePrefersReducedMotion()` is defined in `bridge-status-visualizer.tsx`. It reads `matchMedia("(prefers-reduced-motion: reduce)")` and stays in sync with it. Its result is passed down as a `reduceMotion: boolean` prop to every scene and animated 3D part.

- Every `useFrame` animation has to return early when `reduceMotion` is true. Components that take an optional `animations` object get `undefined` in that case, as `TugBoat` does.
- Scene changes fade over `SCENE_FADE_DURATION = 260` ms. With reduced motion, the scene swaps immediately.

If another component needs this hook, move it into a shared module such as `src/lib/` or a `hooks/` folder rather than copying it.

## The visualizer state machine

`BridgeStatusVisualizer` picks a scene based on `position`:

| Position | Scene | Contents |
| --- | --- | --- |
| `closed` | `BridgeTrafficFlowScene` | Two road slabs. Each has a colored `TrafficBand` and a moving `TrafficFlow` strip whose color and speed come from `TRAFFIC_CONFIG`. |
| `opening` / `closing` | `BridgeTransitionScene` | `Bridge` with leaves at 45°, plus a bobbing `DirectionalArrow` pointing up (opening) or down (closing) |
| `open` | `BridgeOpenScene` | `Bridge` with leaves raised to vertical, a `River` and a rocking, drifting `TugBoat` |
| `unknown` | none | Only the `sr-only` summary is rendered |

The scene only fades out and back in when `position` changes. For any other change, such as traffic or wait time, the current scene re-renders directly. Inside the traffic scene, color and speed changes are animated with exponential smoothing: `blend = 1 - Math.exp(-delta * 5)`, then `color.lerp(target, blend)`.

## 3D component conventions

The shared building blocks are in `src/components/3D/`. Scenes are in `features/bridge-state/components/bridge-status-visualizer/`.

- **Each scene owns its own `<Canvas>`** with a camera (`position`, `fov`), `ambientLight` at about 0.6 and a `directionalLight`. Shadows are only turned on in the open scene. Scene containers are fixed-height divs (`h-[350px]` or `h-[220px]`, `rounded-xl overflow-hidden mt-5`).
- **Geometry is built from simple shapes**, mostly `boxGeometry` and the occasional `cylinderGeometry`, with `meshStandardMaterial`. No models or textures are loaded. Outlines use drei's `<Edges>`.
- **Edge color** is the fill color darkened by 30%: `new Color(c).multiplyScalar(0.7).getStyle()`. This is written out in several places (`getTrafficEdgeColor`, `Bridge`, `BridgeOpenScene`), so a shared helper would be a reasonable refactor.
- **Props:** shared primitives take a `position: [number, number, number]` tuple, a `color`, and optional numbers with defaults. For example, `Bridge` takes `xPosition`, `yPositionLeaf`, `raisedLeafZ`, `raisedLeafRotation` and so on, so different scenes can pose the same bridge differently.
- **Animation:** use `useFrame(({ clock }, delta) => ...)` and change `ref.current.position` or `rotation` directly. Don't put per-frame values in React state.
- **Scene constants** are `SCREAMING_SNAKE` locals at the top of the component (`ROAD_LENGTH`, `RIVER_COLOR` and so on).
- The bridge's traffic slabs always use `TRAFFIC_CONFIG.standstill.color`, because whenever a bridge leaf is visible, traffic is stopped.
- Files that render a `<Canvas>` at the top level of a client tree may need `"use client"`. Today, `bridge-traffic-flow-scene.tsx` has it, and the other scenes inherit it from `bridge-status-visualizer.tsx`.

## Copy and tone

- Commuter-facing text is short, calm and practical: "Drawbridge is raised. Please wait.", "Traffic will resume shortly.", "Waiting for a reliable traffic update."
- When data is unknown, say so ("Unclear", "Waiting for a reliable ... update") instead of guessing.
- Direction titles are "Hutchinson River Pkwy North" and "Hutchinson River Pkwy South".
- Admin text can be more technical and show raw enum values, as in `BridgeStatusCard`.
