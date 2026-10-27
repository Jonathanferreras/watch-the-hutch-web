# Agent Guide: Watch the Hutch Web

Start here before you change anything in this repo. These docs describe how the codebase is actually built today, so that new code reads like the code already around it.

## What this app is

Watch the Hutch is a status page for commuters who cross the Hutchinson River drawbridge. It shows whether the bridge is open, how bad northbound and southbound traffic is, an estimated wait time, and how confident the data is. Raw states are turned into plain-language guidance and a small 3D scene.

This repo is only the **web layer**. The full system has three parts:

1. **Edge detection** (not built yet): a Raspberry Pi with a camera, running Python and OpenCV. It will publish bridge and traffic state.
2. **Cloud data**: Firebase Auth and Firestore.
3. **Web app** (this repo): the Next.js 16 public page, the admin dashboard and the simulation tools.

## Read in this order

| Doc | Read it when you are... |
| --- | --- |
| [architecture.md](./architecture.md) | getting oriented: the stack, folder layout, routes, data flow and data sources |
| [domain-model.md](./domain-model.md) | touching bridge state, traffic, confidence, wait time, events or simulations |
| [patterns.md](./patterns.md) | writing any TypeScript or React: repositories, services, hooks, errors, naming and lint-safe React 19 patterns |
| [ui-and-3d.md](./ui-and-3d.md) | building UI: Tailwind, accessibility, the 3D scenes and reduced motion |
| [recipes.md](./recipes.md) | doing a common task, such as adding a field, a feature, a route or a scene |
| [known-gaps.md](./known-gaps.md) | checking what's unfinished, fragile or easy to misread before you rely on it |

## Golden rules

1. **This is Next.js 16, not the version you were trained on.** Check the bundled docs in `node_modules/next/dist/docs/` before you use any Next API. For example, Middleware is now called `proxy`, request APIs are async, Turbopack is the default, and `next lint` is gone. The upgrade notes are in `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`.
2. **Follow the feature layering.** It goes `types → repository interface → repository implementations → service → hooks → components`. Components never import Firebase or `localStorage` directly. See [patterns.md](./patterns.md).
3. **Every repository needs two backends.** Each one has a Firebase version and a `localStorage` version that behave the same way. When you add a method, add it to both.
4. **Keep the domain invariants.** If the bridge is not `closed`, traffic must be `standstill` or `unknown`. A wait time only applies while the bridge is `opening`, `open` or `closing`. Confidence is a number from 0 to 1. See [domain-model.md](./domain-model.md).
5. **Write plain language for commuters.** Users see readable guidance, never raw enum values. The admin views are the one place raw values appear.
6. **Accessibility and reduced motion are required.** Use labelled controls, `role="status"` and `role="alert"`, an `sr-only` summary next to any `aria-hidden` canvas, and respect `prefers-reduced-motion`.
7. **Match the file you're in.** Formatting isn't enforced (there's no Prettier), and indentation differs between files. Match the surrounding file instead of reformatting it.

## Commands

```bash
npm install         # install dependencies
npm run dev         # dev server on http://localhost:3000 (Turbopack)
npm run build       # production build
npx eslint          # lint (next lint was removed in Next 16; `npm run lint` runs eslint)
npx tsc --noEmit    # type-check
```

There is **no test suite and no CI** yet. Before you open a PR, run `npx eslint` and `npx tsc --noEmit`. Both pass cleanly on `main` today. If your change affects the UI, also check it by hand with `npm run dev`. Switch the admin dashboard to the **Local (Demo)** data source so you can test without Firebase writes. See the "Running without Firebase" section in [architecture.md](./architecture.md#running-without-firebase).

## Commit style

Commits follow Conventional Commits with lowercase types: `feat:`, `refactor:`, `style:`, `docs:`, `build:`, and sometimes a scope such as `feat(navbar):`. Subjects are imperative and lowercase, for example `feat: add simulation playback route`.
