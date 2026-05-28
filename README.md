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
├── public/
│
└── src/
    ├── app/                         # Next.js App Router: pages, layouts, and route-specific UI.
    │   ├── admin/
    │   │   ├── (protected)/
    │   │   │   ├── dashboard/
    │   │   │   │   └── page.tsx
    │   │   │   └── layout.tsx
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   └── layout.tsx
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    │
    ├── features/                    # Product/domain-specific modules.
    │   ├── auth/
    │   │   ├── components/
    │   │   │   └── auth-provider.tsx
    │   │   ├── hooks/
    │   │   │   └── use-auth.ts
    │   │   ├── auth.service.ts
    │   │   └── auth.types.ts
    │   │
    │   └── bridge-state/
    │       ├── components/
    │       │   ├── bridge-state-editor.tsx
    │       │   └── bridge-status-card.tsx
    │       ├── hooks/
    │       │   └── use-bridge-state.ts
    │       ├── bridge-state.service.ts
    │       └── bridge-state.types.ts
    │
    └── lib/                         # Shared utility functions and database/SDK clients.
        ├── firebase/
        │   ├── auth.ts
        │   ├── collections.ts
        │   ├── db.ts
        │   └── sdk.ts
        └── errors.ts
```
