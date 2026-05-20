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
├── src/
│   ├── app/                         # Next.js App Router: pages, layouts, route handlers, and route-specific UI.
│   │   ├── admin/
│   │   │   ├── (protected)/
│   │   │   │   ├── dashboard/
│   │   │   └── login/
│   │   │
│   │   ├── api/                     # Route handlers.
│   │   │   ├── bridge-state/
│   │   │   └── session/
│   │
│   ├── components/                  # Shared project components
│   │
│   ├── features/                    # Product/domain-specific code.
│   │   ├── auth/
│   │   │
│   │   └── bridge-state/
│   │
│   └── lib/
│       └── firebase/
```
