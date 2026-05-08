# Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Project Source Code Structure

```txt
WATCH-THE-HUTCH-WEB/
├── src/
│   ├── api/
│   │
│   ├── app/         # for routing, layouts, route handlers, and route-specific UI.
│   │
│   ├── components/  # for reusable generic components like buttons, inputs, dialogs, cards, tables, etc.
│   │
│   ├── features/    # for real product domains like auth, billing, orders, users, projects, etc.
│   │
│   ├── hooks/
│   │
│   ├── lib/         # for app-wide infrastructure: database client, auth config, env validation, API clients, analytics, utilities.
│   │
│   ├── styles/
│   │
│   ├── tests/
│   │
│   ├── types/
│   │
│   └── middleware.ts
```
