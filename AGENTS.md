# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Contributing to this repo

Before changing code, read the agent guide in [`docs/agents/`](docs/agents/README.md). It covers the architecture, domain model, coding patterns, UI/3D conventions, step-by-step recipes and known gaps. Follow the patterns there so new code matches the existing code.

Quick rules:

- Feature code follows `types → repository (Firebase + localStorage) → service → hooks → components`. Components never call Firebase or `localStorage` directly.
- Every repository method must exist in both the Firebase and the localStorage implementation.
- When the bridge is not `closed`, traffic is `standstill` or `unknown`. Wait time only exists while the bridge is `opening`, `open` or `closing`.
- Keep the accessibility and reduced-motion handling intact.
- Verify with `npx eslint` and `npx tsc --noEmit`. There is no test suite yet.
- Update `docs/agents/` when you change a pattern, the domain model or a route.
