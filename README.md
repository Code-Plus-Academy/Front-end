# CPA Frontend — Next.js Migration

Migrated from **Vite + React Router SPA** → **Next.js 14 App Router**.
The backend (Express/Node) is **unchanged**.

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local → set NEXT_PUBLIC_API_BASE_URL to your backend

# 3. Run dev server
npm run dev        # http://localhost:3000 (frontend)
                   # backend should run on a different port, e.g. 4000

# 4. Build for production
npm run build && npm start
```

---

## Architecture

```
src/
├── app/                     # Next.js App Router — one page.jsx per URL
│   ├── layout.jsx           # Root layout: fonts, GA4, theme-init script
│   ├── providers.jsx        # Client providers: Auth, Theme, Toaster
│   ├── page.jsx             # / → Landing
│   ├── feed/page.jsx        # /feed (PrivateRoute)
│   ├── explore/page.jsx     # /explore
│   ├── posts/[id]/page.jsx  # /posts/:id
│   ├── u/[username]/...     # Profile sub-routes
│   └── ...                  # (all routes mirror original App.jsx)
│
├── pages-src/               # Original page components — UNCHANGED
│   ├── Landing.jsx
│   ├── Feed.jsx
│   ├── auth/Login.jsx
│   └── ...
│
├── components/              # Original components — UNCHANGED (+ 'use client' added)
│   ├── layout/Navbar.jsx
│   ├── shared/AppLayout.jsx     ← NEW: extracted from App.jsx
│   ├── shared/RouteGuards.jsx   ← NEW: PrivateRoute / ProfessionalRoute / PublicOnlyRoute
│   ├── shared/Analytics.jsx     ← NEW: GA4 hook wrapped in Suspense
│   └── seo/HelmetShim.jsx       ← NEW: react-helmet-async shim for client-side title updates
│
├── context/
│   ├── AuthContext.jsx      # Updated: useRouter instead of window.location
│   └── ThemeContext.jsx     # Updated: SSR-safe localStorage init
│
├── hooks/
│   └── useAnalytics.js      # Updated: usePathname/useSearchParams (Next.js)
│
└── api/
    └── axios.js             # Updated: relative /api base URL for dev proxy
```

---

## Key changes from the Vite version

| Vite / React Router | Next.js App Router |
|---|---|
| `<BrowserRouter>` + `<Routes>` in `App.jsx` | File-system routing under `src/app/` |
| `react-router-dom` `useNavigate` | `useRouter` from `next/navigation` |
| `react-router-dom` `useLocation` | `usePathname` + `useSearchParams` |
| `react-router-dom` `useParams` | `useParams` from `next/navigation` |
| `react-router-dom` `<Link to=...>` | `<Link href=...>` from `next/link` |
| `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |
| `react-helmet-async` `<Helmet>` | `HelmetShim` (client title updates) + root `metadata` export |
| `index.html` with inline `<script>` | `layout.jsx` `dangerouslySetInnerHTML` scripts |
| Vite dev proxy | `next.config.js` `rewrites()` proxy to Express backend |
| `hydrateRoot` / `createRoot` | Next.js handles hydration |

---

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3000` | Express backend origin |

In **development**, `next.config.js` rewrites `/api/*` → `${NEXT_PUBLIC_API_BASE_URL}/api/*`,
so the frontend and backend can run on different ports with no CORS issues.

In **production**, either:
- Point `NEXT_PUBLIC_API_BASE_URL` to your backend domain (CORS must allow your frontend origin), **or**
- Add a reverse-proxy rewrite in nginx / your hosting provider so `/api` calls go to the backend.

---

## Backend — no changes needed

The Express backend is 100% untouched. It still:
- Serves the REST API at `/api/*`
- Sets `cpa_token` as an HTTP-only cookie
- Handles CORS for your frontend origin

---

## Deploying

**Vercel (recommended)**
```bash
vercel deploy
# Set NEXT_PUBLIC_API_BASE_URL in Vercel dashboard
# Add a Vercel rewrite or configure CORS on the backend
```

**Self-hosted**
```bash
npm run build
npm start          # runs Next.js on port 3000 by default
```
