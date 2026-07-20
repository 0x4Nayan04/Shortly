# Shortly

> Privacy-first URL shortener with click analytics, custom aliases, and a dashboard.
> Built to learn end-to-end full-stack development with React, Express, and MongoDB.

**Live demo:** [https://shortly.nayanswarnkar.com/](https://shortly.nayanswarnkar.com/) · short links on [https://s.nayanswarnkar.com/](https://s.nayanswarnkar.com/)

<p align="left">
  <a href="https://shortly.nayanswarnkar.com/"><img src="https://img.shields.io/badge/demo-shortly.nayanswarnkar.com-6366f1?style=for-the-badge" alt="Live demo" /></a>
  <img src="https://img.shields.io/badge/status-live-brightgreen" alt="Status" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  <img src="https://img.shields.io/badge/node-22-339933" alt="Node" />
  <img src="https://img.shields.io/badge/mongo-replica%20set-47A248" alt="MongoDB" />
</p>

<video src="./FRONTEND/public/demo/demo.mp4" width="1280" autoplay loop muted playsinline>
  <a href="./FRONTEND/public/demo/demo.mp4">Watch the Shortly demo</a>
</video>

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Production (Vercel)](#production-vercel)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Design tradeoffs](#design-tradeoffs)
- [Security](#security)
- [Testing](#testing)
- [Scripts](#scripts)
- [License](#license)

## Features

**Short links**

- Shorten URLs as a guest — no account required (random 7-char slug)
- Custom aliases (3–20 chars, `[a-z0-9_-]`) when signed in
- Edit destination or alias; disable / enable without deleting
- Sign in to claim guest links into your dashboard automatically
- Email a one-time claim link to recover guest links on another device
- Authenticated same-destination reuse (returns the existing link instead of creating a duplicate)

**Analytics & dashboard**

- Click analytics: lifetime totals, range charts, top countries / devices / browsers / OS / referrers, top URLs (loaded only on `/dashboard`)
- Dashboard with prefix search, sort, pagination, bulk delete, QR codes
- Client server-state via TanStack Query; bounded process-local caches on the API for stats and auth-user reads

**Account & trust**

- Account settings: profile name, password (min 12 chars), account deletion
- Email verification and password reset (Resend — required in production)
- In-app privacy policy at `/privacy`
- Tiered per-endpoint rate limiting
- Health checks at `/api/health`, `/api/ready`, `/api/live`

## Tech stack

| Layer    | Technologies |
| -------- | ------------ |
| Frontend | React 19, Vite 6, Tailwind CSS 4, React Router, TanStack Query, Axios, react-hot-toast, lucide-react, qrcode |
| Backend  | Node.js, Express 5, MongoDB + Mongoose 8, JWT (HTTP-only cookies), bcrypt, Joi, Resend, Helmet, geoip-lite, ua-parser-js |
| Testing  | Vitest, Testing Library, Playwright, Node test runner, mongodb-memory-server |

## Quick start

```bash
git clone https://github.com/0x4Nayan04/Shortly.git
cd Shortly
npm run install:all

cp BACKEND/.env.example BACKEND/.env
cp FRONTEND/.env.example FRONTEND/.env
```

Start the API and frontend in two terminals:

```bash
npm run dev:backend   # http://127.0.0.1:3001
npm run dev:frontend  # http://127.0.0.1:5173
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

> **MongoDB:** Click analytics use transactions, so the database must be a replica set (Atlas works). A standalone local MongoDB will still redirect, but click recording may fail.
>
> **Email:** `RESEND_API_KEY` is optional in development. Without it, registration auto-verifies the account; the user still signs in on the login form (no session cookie is set at register).

## Environment variables

### Backend (`BACKEND/.env`)

Minimum for local development:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/url_shortener
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
FRONT_END_URL=http://127.0.0.1:5173
PORT=3001
NODE_ENV=development
```

Optional / production — see [BACKEND/.env.example](./BACKEND/.env.example) for the full list:

| Variable | Purpose |
| -------- | ------- |
| `PUBLIC_BASE_URL` | Public URL for short links / QR codes (**required in production**) |
| `ALLOWED_ORIGINS` | Extra CORS origins (production) |
| `TRUST_PROXY` | Express proxy hop count (**required in production**) |
| `COOKIE_SAME_SITE` | `lax` (default), `strict`, or `none` for intentional cross-site cookies |
| `MAX_LINKS_PER_USER` | Per-user link cap (default 1000) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Transactional email (**required in production**) |
| `EMAIL_ASSET_BASE_URL` | Frontend URL for email images |
| `OPERATIONS_ALERT_WEBHOOK_URL` | Webhook for operational alerts |

### Frontend (`FRONTEND/.env`)

Development:

```env
# Leave empty in dev — Vite proxies /api to the backend
VITE_APP_URL=
VITE_PUBLIC_SHORT_URL=http://127.0.0.1:5173
VITE_BACKEND_DEV_URL=http://127.0.0.1:3001
SHORT_LINK_PROXY_ORIGIN=
```

Production — set `VITE_APP_URL` to your API origin (required for `vite build`), `VITE_PUBLIC_SHORT_URL` to your public short-link host, and optionally `SHORT_LINK_PROXY_ORIGIN` when the rewrite target differs from `VITE_APP_URL`. See [FRONTEND/.env.example](./FRONTEND/.env.example).

## Production (Vercel)

### Short-link routing

The frontend build generates `vercel.json` rewrites that proxy slug-shaped paths (`/^[a-zA-Z0-9_-]{3,20}$/`, excluding SPA routes) to `SHORT_LINK_PROXY_ORIGIN` (defaults to `VITE_APP_URL`). This mirrors the Vite dev proxy in `FRONTEND/vite.config.js`.

Set both env vars in your Vercel frontend project (and point the public short host, e.g. `s.nayanswarnkar.com`, at the same proxy origin), then smoke-test a live slug after deploy:

```bash
PUBLIC_SHORT_HOST=https://shortly.example.com \
SHORT_LINK_PROXY_ORIGIN=https://api.example.com \
npm run smoke:routing --prefix FRONTEND your-slug
```

### Build pipeline

`npm run build:frontend` runs three steps:

1. **`generate-vercel-config.js`** — writes `vercel.json` rewrites and security headers
2. **`vite build`** — SPA bundle
3. **`generate-seo-shells.js`** — crawler HTML shells in `dist/_seo/`, plus `dist/sitemap.xml` and `dist/robots.txt` from `VITE_PUBLIC_SHORT_URL`

### SEO & security headers

The generated `vercel.json` includes `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`, and a report-only CSP.

Crawlers requesting `/` or `/privacy` receive route-specific Open Graph metadata via Vercel Edge Middleware ([`FRONTEND/middleware.js`](./FRONTEND/middleware.js)) and the build-time SEO shells.

## Documentation

| Resource | Contents |
| -------- | -------- |
| [/privacy](https://shortly.nayanswarnkar.com/privacy) (in-app) | Public privacy and analytics retention policy |
| [BACKEND/.env.example](./BACKEND/.env.example) | All backend environment variables |
| [FRONTEND/.env.example](./FRONTEND/.env.example) | All frontend environment variables |

## Architecture

```
FRONTEND/      React 19 + Vite SPA (TanStack Query for dashboard server-state)
BACKEND/       Express 5 API
  src/
    routes/        REST endpoints (auth, shortUrl, health)
    controllers/   request handling
    services/      business logic
      shortUrl/    persist, redirect, claim, claim recovery
      auth, account, analytics, email, click, …
    dao/           Mongo access layer (active-link scoped click facets)
    schema/        User, ShortUrl, Click, RateLimit
    middleware/    auth, csrf, rate limit, validation, latency
    validation/    Joi schemas
    utils/         authToken (+ auth-user cache), slug/url helpers, mongoTransaction
```

`GET /api/auth/me` returns `Cache-Control: no-store` (HTTP) and reuses the user already resolved by auth middleware when present — no duplicate Mongo profile read on that path. Process-local auth-user / stats caches live in the auth-token util and `shortUrl.services.js` (separate from HTTP caching; see [Design tradeoffs](#design-tradeoffs)).

### Routes

| Path | Access | Page |
| ---- | ------ | ---- |
| `/` | Public | Landing |
| `/login`, `/register`, `/verify-email/:token`, `/forgot-password`, `/reset-password/:token` | Guest | Auth |
| `/dashboard`, `/settings` | Signed in | Dashboard, account settings |
| `/claim-link/:token` | Signed in | Guest email claim recovery (`POST /api/create/claim/redeem`) |
| `/privacy` | Public | Privacy policy |
| `/:short_url` | Public | Proxied redirect (dev: Vite → backend) |

### Frontend layout

| Area | Notes |
| ---- | ----- |
| `api/` | Axios clients |
| `contexts/` | `authSessionStore`, `AuthContext` (session bootstrap) |
| `hooks/` | `useDashboardList` (15s stale), `useUrlStats` (30s stale), `useDashboardMutations`, form controllers |
| `layouts/` | `GuestOnlyLayout`, `ProtectedLayout`, `AuthPageLayout`, … |
| `components/` | `app/`, `dashboard/`, `settings/`, `landing/`, `urlForm/`, `ux/`, … |
| `styles/domains/` | Design tokens; run `npm run css:check` after CSS edits |
| `public/assets/` | Brand mark/nav as committed WebP |

**Session:** Bootstrap via `GET /api/auth/me`; profile saves call `PATCH /api/auth/me`, then `updateUser` + `refreshUser`. Stats queries run only on `/dashboard`.

**API responses:** Axios flattens `{ success, message, data: { … } }` via `mergeApiEnvelope`. Use `getApiPayload` and `getApiErrorMessage` from `FRONTEND/src/utils/axiosInstance.js`.

## Design tradeoffs

Intentional product/engineering decisions — useful context for reviewers and interviews.

<details>
<summary><strong>1. Fast redirects over exact click counts</strong></summary>

The redirect handler sends `302` first, then records the click asynchronously after the response finishes (`res.once('finish', recordClick)`). This keeps links fast for visitors.

**Tradeoff:** If a visitor closes the tab immediately after the redirect resolves, the visit may never be recorded. Bot user-agents are excluded from recording entirely.

</details>

<details>
<summary><strong>2. 30-day analytics window, but lifetime click totals</strong></summary>

Raw click events live in a `clicks` collection with a MongoDB TTL index (30 days). The link's `click` counter is incremented transactionally on every recorded redirect and is **not** tied to the TTL window — total clicks are lifetime, but breakdown charts cover the last 30 days only.

</details>

<details>
<summary><strong>3. Anonymous links: device-local, with email recovery</strong></summary>

Guests can shorten without an account. The backend returns a `manage_token`; the frontend stores `{ id, manage_token }` in `localStorage`. On sign-in, `/api/create/claim` transfers ownership.

For cross-device recovery, guests can email themselves a one-time claim link (`POST /api/create/claim/email` → `/claim-link/:token` after sign-in).

**Tradeoff:** Without signing in or using email recovery, clearing browser data loses manage access — the short link itself still works.

</details>

<details>
<summary><strong>4. Two rate-limit strategies, picked by path temperature</strong></summary>

- **DB-backed `rateLimiter`** (auth, custom-create, etc.) — accurate across instances, one extra Mongo round-trip per request.
- **In-memory `memoryRateLimiter`** for the redirect hot path — zero DB cost per redirect, not shared across instances.

Redirects read MongoDB directly so edits, disables, and retirements stay consistent across every backend instance. Process-local stats/auth caches share the same per-instance caveat (see tradeoff 8).

</details>

<details>
<summary><strong>5. Permanent slug retirement</strong></summary>

Deleted links become permanent, non-identifying tombstones. The destination, owner, management token, and lifetime counter are scrubbed; the slug and retirement time remain so an old public URL can never be taken over. Retired links return HTTP 410.

</details>

<details>
<summary><strong>6. Redirect destination validation</strong></summary>

`isSafeRedirectUrl` accepts only HTTP(S) destinations and rejects `localhost` plus literal loopback, private, unspecified, and link-local IPv4/IPv6 addresses. The backend does not resolve DNS or fetch destination content. Validation runs when a destination is saved and before a redirect is returned.

</details>

<details>
<summary><strong>7. Analytics scoped to the user’s links, not a collection-wide join</strong></summary>

Dashboard click facets resolve the signed-in user’s **active** link IDs, then `$match` + `$facet` on the `clicks` collection (compound `{ short_url_id, timestamp }`). That avoids a collection-wide `$lookup` that would scale with *every* click in the database, including other users’.

**Tradeoff:** Empty / cold paths pay a small active-ID lookup first; the win shows up as owned click volume grows and when unrelated click docs exist in the same DB.

</details>

<details>
<summary><strong>8. Bounded process-local caches (not Redis)</strong></summary>

Stats responses and authenticated-user resolution use process-local `Map`s (30s TTL, bounded size) with explicit invalidation on link/auth mutations. Concurrent stats requests for the same user share one in-flight build. Redirects stay uncached and always read Mongo for link state.

**Tradeoff:** Click-driven dashboard totals may lag up to the TTL; caches are **per Node process** (same class of caveat as the in-memory redirect rate limiter). No Redis dependency for a solo portfolio deploy.

Frontend TanStack Query uses ~30s `staleTime` by default and for stats; the dashboard list uses **15s**. Stats fetch only on `/dashboard`.

</details>

<details>
<summary><strong>9. Prefix dashboard search for index use</strong></summary>

List search uses case-sensitive **prefix** matching on `short_url` / `full_url` so compound `{ user, retiredAt, … }` indexes can apply.

**Tradeoff:** Mid-string and case-insensitive search are not supported — acceptable for a small personal link list.

</details>

## Security

- bcrypt password hashing; JWT in HTTP-only cookies (~24h) with `tokenVersion` (invalidated on password change / logout)
- Email verification gate when Resend is configured (required in production)
- Joi validation on every input; CSRF checks on cookie-backed writes
- CORS with explicit origin allowlist (`FRONT_END_URL` + `ALLOWED_ORIGINS`)
- Per-endpoint rate limits, reserved-slug protection, redirect URL validation
- Guest manage tokens stored hashed; raw token returned only at create time
- Helmet, gzip, request IDs, latency tracking, graceful shutdown
- Profile HTTP responses use `Cache-Control: no-store` on `/api/auth/me`; auth-user cache is invalidated on logout, profile, password, and account mutations

## Testing

| Command | What it runs |
| ------- | ------------ |
| `npm run test:backend` | Node test runner + in-memory MongoDB replica set (incl. auth/stats cache characterization) |
| `npm run test:frontend` | Vitest + Testing Library |
| `npm run test:e2e` | Playwright — starts test backend (`BACKEND/scripts/e2e-server.mjs`) and Vite dev server |
| `npm run test:all` | Backend + frontend unit tests |

Run the full suite from the repo root:

```bash
npm run test:all && npm run test:e2e
```

**CI:** [backend-ci.yml](./.github/workflows/backend-ci.yml) runs lint, tests, and `npm audit`; [frontend-ci.yml](./.github/workflows/frontend-ci.yml) runs unit tests and Playwright e2e on Node 22.

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run install:all` | Install backend + frontend dependencies |
| `npm run dev:backend` | Start API with nodemon |
| `npm run start:backend` | Start API (production entry) |
| `npm run dev:frontend` | Start Vite dev server |
| `npm run build:frontend` | Production frontend build (`VITE_APP_URL` required) |
| `npm run lint:frontend` | ESLint (frontend) |
| `npm run lint:backend` | ESLint (backend) |
| `npm run css:check` | Assemble CSS + verify design tokens |
| `npm run test:backend` | Backend integration tests |
| `npm run test:frontend` | Frontend unit tests |
| `npm run test:e2e` | Playwright e2e |
| `npm run test:all` | Backend + frontend unit tests |
| `npm run format` | Prettier — format tracked source/docs |
| `npm run format:check` | Prettier — verify formatting (CI-friendly) |

From `FRONTEND/`: `npm run generate:vercel`, `npm run smoke:routing`, `npm run doctor`, `npm run check`.

## License

[MIT](./LICENSE)
