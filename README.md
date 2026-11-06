# Shortly

<p align="left">
  <img src="./FRONTEND/public/assets/Shortly_Logo_nav.webp" alt="Shortly" height="40" />
</p>

Privacy-first URL shortener with click analytics, custom aliases, and a signed-in dashboard. Live at [shortly.nayanswarnkar.com](https://shortly.nayanswarnkar.com/); short links on [s.nayanswarnkar.com](https://s.nayanswarnkar.com/).

Built as an end-to-end learning project (React, Express, MongoDB) that is also deployed and used — not a tutorial clone of Bitly.

[![Live](https://img.shields.io/badge/status-live-brightgreen)](https://shortly.nayanswarnkar.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-22-339933)](https://nodejs.org/)

<video src="./FRONTEND/public/demo/demo.mp4" width="1280" autoplay loop muted playsinline>
  <a href="./FRONTEND/public/demo/demo.mp4">Watch the Shortly demo</a>
</video>

## Why this exists

Most shorteners bury privacy and ownership details behind a SaaS wall. Shortly is a small, self-hostable stack that:

- Lets guests create links without an account (device-local manage tokens, optional email claim)
- Keeps detailed click events for **30 days** (TTL) while lifetime click totals stay on the link
- Documents the real tradeoffs (async click recording, process-local caches, slug retirement) instead of pretending it is Redis-scale infra

**Status:** live portfolio app, actively maintained by one author. MIT. Expect solo-project ops (per-process caches, no Redis).

**Not for you if** you need multi-region redirects, shared rate limits across many API instances, or mid-string dashboard search.

## Quick start

Requires **Node 22** and a **MongoDB replica set** (Atlas is fine). Click recording and several account flows use transactions — a standalone local `mongod` will redirect but may fail to record clicks.

```bash
git clone https://github.com/0x4Nayan04/Shortly.git
cd Shortly
npm run install:all

cp BACKEND/.env.example BACKEND/.env
cp FRONTEND/.env.example FRONTEND/.env
```

Minimum backend values for local work:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/url_shortener
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
FRONT_END_URL=http://127.0.0.1:5173
PORT=3001
NODE_ENV=development
```

```bash
npm run dev:backend   # http://127.0.0.1:3001
npm run dev:frontend  # http://127.0.0.1:5173
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

> **Email:** `RESEND_API_KEY` is optional in development. Without it, registration auto-verifies; the user still signs in on the login form (no session cookie at register). Full variable lists: [BACKEND/.env.example](./BACKEND/.env.example), [FRONTEND/.env.example](./FRONTEND/.env.example).

## Features

**Links**

- Guest shorten (random 7-char slug) or signed-in custom aliases (3–20 characters, starting with a letter or number; hyphens and underscores allowed)
- Edit destination/alias; disable without deleting; permanent slug retirement on delete (HTTP 410)
- Claim guest links on sign-in; email a one-time claim for another device
- Same-destination reuse for authenticated users (returns the existing link)

**Dashboard & analytics**

- Lifetime click totals; 30-day breakdowns (countries, devices, browsers, OS, referrers, top URLs)
- Prefix search, sort, pagination, bulk delete, QR codes
- Stats load only on `/dashboard` (TanStack Query; API process-local cache ~30s)

**Account**

- Profile name, password (min 12), account deletion
- Email verification / password reset via Resend (**required in production**)
- In-app privacy policy at `/privacy`
- Per-endpoint rate limits; `/api/health`, `/api/ready`, `/api/live`

## Tech stack

| Layer | Stack |
| ----- | ----- |
| Frontend | React 19, Vite 6, Tailwind CSS 4, React Router, TanStack Query, Axios, qrcode |
| Backend | Node.js, Express 5, MongoDB + Mongoose 8, JWT (HTTP-only cookies), bcrypt, Joi, Resend, Helmet, geoip-lite, ua-parser-js |
| Tests | Vitest, Testing Library, Playwright, Node test runner, mongodb-memory-server |

## Architecture

```mermaid
flowchart LR
  Browser["Browser / SPA"]
  Vite["Vite / Vercel<br/>SPA + short-link proxy"]
  API["Express API"]
  Mongo[("MongoDB replica set")]

  Browser --> Vite
  Vite -->|"/api/*, /:slug"| API
  API --> Mongo
```

```mermaid
flowchart TB
  subgraph frontend [FRONTEND]
    Pages["Routes + layouts"]
    Query["TanStack Query"]
    Axios["Axios clients"]
    Pages --> Query --> Axios
  end

  subgraph backend [BACKEND]
    Routes["routes/"]
    Controllers["controllers/"]
    Services["services/"]
    Dao["dao/"]
    Schema["schema/"]
    Routes --> Controllers --> Services --> Dao --> Schema
  end

  Axios --> Routes
```

| Path | Access | Page |
| ---- | ------ | ---- |
| `/` | Public | Landing |
| `/login`, `/register`, `/verify-email/:token`, `/forgot-password`, `/reset-password/:token` | Guest | Auth |
| `/dashboard`, `/settings` | Signed in | Dashboard, settings |
| `/claim-link/:token` | Signed in | Guest email claim recovery |
| `/privacy` | Public | Privacy policy |
| `/:short_url` | Public | Proxied redirect (dev: Vite → API) |

Backend layout: `routes/` → `controllers/` → `services/` (shortUrl persist/redirect/claim, auth, account, analytics, email, click) → `dao/` → `schema/` (`User`, `ShortUrl`, `Click`, `RateLimit`), plus middleware (auth, CSRF, rate limit, validation) and Joi under `validation/`.

Frontend layout: `api/`, `contexts/` (session), `hooks/` (dashboard list ~15s stale, stats ~30s), `layouts/`, `components/`, `styles/domains/` (`npm run css:check` after CSS edits).

`GET /api/auth/me` returns `Cache-Control: no-store` and reuses the user already resolved by auth middleware when present.

## Design tradeoffs

Intentional decisions — useful for reviewers and interviews.

<details>
<summary><strong>1. Fast redirects over exact click counts</strong></summary>

The redirect handler sends `302` first, then records the click after the response finishes (`res.once('finish', recordClick)`).

**Tradeoff:** Closing the tab immediately after the redirect may skip recording. Bot user-agents are not recorded.

</details>

<details>
<summary><strong>2. 30-day analytics window, lifetime click totals</strong></summary>

`clicks` use a MongoDB TTL index (`CLICK_RETENTION_DAYS = 30`). The link `click` counter is incremented transactionally and is not TTL-bound — charts cover 30 days; totals are lifetime.

</details>

<details>
<summary><strong>3. Anonymous links: device-local, with email recovery</strong></summary>

Guests get a `manage_token`; the frontend stores `{ id, manage_token }` in `localStorage`. Sign-in claims via `/api/create/claim`. Cross-device: `POST /api/create/claim/email` → `/claim-link/:token`.

**Tradeoff:** Without sign-in or email recovery, clearing browser data loses manage access; the short link still works.

</details>

<details>
<summary><strong>4. Two rate-limit strategies</strong></summary>

- DB-backed `rateLimiter` for auth / custom-create — accurate across instances, one Mongo round-trip
- In-memory `memoryRateLimiter` on the redirect hot path — free per request, not shared across instances

Redirects always read Mongo so edits, disables, and retirements stay consistent.

</details>

<details>
<summary><strong>5. Permanent slug retirement</strong></summary>

Deletes become non-identifying tombstones (destination/owner/token/counter scrubbed; slug + retirement time kept). Retired slugs return **410** and cannot be reused.

</details>

<details>
<summary><strong>6. Redirect destination validation</strong></summary>

`isSafeRedirectUrl` allows only HTTP(S) and rejects localhost plus literal loopback/private/unspecified/link-local addresses. No DNS resolve or destination fetch. Checked on save and before redirect.

</details>

<details>
<summary><strong>7. Analytics scoped to the user’s links</strong></summary>

Facets resolve the user’s **active** link IDs, then `$match` + `$facet` on `clicks` (`{ short_url_id, timestamp }`) — avoids a collection-wide `$lookup` over every click in the DB.

</details>

<details>
<summary><strong>8. Bounded process-local caches (not Redis)</strong></summary>

Stats overview, click analytics, auth-user resolution, and redirect slug lookups use process-local `Map`s (short TTLs, bounded, invalidated on mutations). Concurrent builds coalesce. Dashboard splits light overview (`/api/create/stats`) from heavy click facets (`/api/create/stats/analytics`).

**Tradeoff:** Totals / redirect targets can lag up to the TTL after edits; caches are per Node process. No Redis for a solo portfolio deploy.

Frontend: ~30s `staleTime` for stats; dashboard list **15s**. Stats fetch only on `/dashboard` (overview + analytics as separate queries).

</details>

<details>
<summary><strong>9. Prefix dashboard search for indexes</strong></summary>

Case-sensitive **prefix** match on `short_url` / `full_url` so compound `{ user, retiredAt, … }` indexes apply. No mid-string or case-insensitive search.

</details>

## Security

- bcrypt passwords; JWT in HTTP-only cookies (~24h) with `tokenVersion` (invalidated on password change / logout)
- Email verification when Resend is configured (required in production)
- Joi on inputs; CSRF on cookie-backed writes; CORS allowlist (`FRONT_END_URL` + `ALLOWED_ORIGINS`)
- Per-endpoint rate limits, reserved slugs, redirect URL validation
- Guest manage tokens stored hashed; raw token only at create time
- Helmet, gzip, request IDs, latency tracking, graceful shutdown

## Production (Vercel)

Frontend build writes `vercel.json` rewrites so slug-shaped paths (`/^[a-zA-Z0-9_-]{3,20}$/`, excluding SPA routes) proxy to `SHORT_LINK_PROXY_ORIGIN` (defaults to `VITE_APP_URL`). Same idea as the Vite dev proxy in `FRONTEND/vite.config.js`.

```bash
PUBLIC_SHORT_HOST=https://shortly.example.com \
SHORT_LINK_PROXY_ORIGIN=https://api.example.com \
npm run smoke:routing --prefix FRONTEND your-slug
```

`npm run build:frontend` runs:

1. `generate-vercel-config.js` — rewrites + security headers
2. `vite build`
3. `generate-seo-shells.js` — crawler shells, `sitemap.xml`, `robots.txt`

Production backend also needs `PUBLIC_BASE_URL`, `TRUST_PROXY`, and Resend. Crawlers hitting `/` or `/privacy` get OG metadata via [`FRONTEND/middleware.js`](./FRONTEND/middleware.js) and the SEO shells.

Privacy policy (live): [shortly.nayanswarnkar.com/privacy](https://shortly.nayanswarnkar.com/privacy)

## Testing & scripts

| Command | Runs |
| ------- | ---- |
| `npm run test:backend` | Node test runner + in-memory MongoDB replica set |
| `npm run test:frontend` | Vitest + Testing Library |
| `npm run test:e2e` | Playwright (test API + Vite) |
| `npm run test:all` | Backend + frontend unit tests |
| `npm run install:all` | Install both packages |
| `npm run lint:frontend` / `lint:backend` | ESLint |
| `npm run css:check` | Design tokens |
| `npm run format` / `format:check` | Prettier |

```bash
npm run test:all && npm run test:e2e
```

CI: [backend-ci.yml](./.github/workflows/backend-ci.yml) (lint, tests, audit) · [frontend-ci.yml](./.github/workflows/frontend-ci.yml) (unit + Playwright on Node 22).

From `FRONTEND/`: `npm run generate:vercel`, `npm run smoke:routing`, `npm run doctor`, `npm run check`.

MIT — see [LICENSE](./LICENSE).
