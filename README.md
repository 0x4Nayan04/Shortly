# Shortly

> Privacy-first URL shortener with click analytics, custom aliases, and a dashboard.
> Built to learn end-to-end full-stack development with React, Express, and MongoDB.

**Live demo:** [https://shortly.nayanswarnkar.com/](https://shortly.nayanswarnkar.com/)

<p align="left">
  <a href="https://shortly.nayanswarnkar.com/"><img src="https://img.shields.io/badge/demo-shortly.nayanswarnkar.com-6366f1?style=for-the-badge" alt="Live demo" /></a>
  <img src="https://img.shields.io/badge/status-live-brightgreen" alt="Status" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  <img src="https://img.shields.io/badge/node-18%2B-339933" alt="Node" />
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

- Shorten URLs as a guest — no account required
- Custom aliases (3–20 chars)
- Sign in to claim guest links into your dashboard automatically

**Analytics & dashboard**

- Click analytics: clicks over time, top countries, device, browser, OS
- Dashboard with search, sort, pagination, bulk delete, QR codes

**Account & trust**

- Account settings: profile name, password, account deletion
- Email verification and password reset (Resend)
- In-app privacy policy at `/privacy`
- Abuse reporting API with operator email alerts and an admin review queue
- Tiered per-endpoint rate limiting

## Tech stack

| Layer    | Technologies |
| -------- | ------------ |
| Frontend | React 19, Vite 6, Tailwind CSS 4, React Router, Axios, react-hot-toast, lucide-react, qrcode |
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
> **Email:** `RESEND_API_KEY` is optional in dev. Without it, registration auto-verifies and logs the user in immediately.

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

Optional — see [BACKEND/.env.example](./BACKEND/.env.example) for the full list:

| Variable | Purpose |
| -------- | ------- |
| `PUBLIC_BASE_URL` | Public URL for short links / QR codes |
| `ALLOWED_ORIGINS` | Extra CORS origins (production) |
| `TRUST_PROXY` | Express proxy hop count (required in production) |
| `MAX_LINKS_PER_USER` | Per-user link cap (default 1000) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Transactional email |
| `EMAIL_ASSET_BASE_URL` | Frontend URL for email images |
| `OPERATOR_EMAIL`, `ABUSE_INBOX_EMAIL` | Operator contact inboxes |
| `ADMIN_EMAILS` | Emails allowed to access `/api/admin/abuse` |
| `OPERATIONS_ALERT_WEBHOOK_URL` | Webhook for operational alerts |

### Frontend (`FRONTEND/.env`)

Development:

```env
# Leave empty in dev — Vite proxies /api to the backend
VITE_APP_URL=
VITE_PUBLIC_SHORT_URL=http://127.0.0.1:5173
VITE_BACKEND_DEV_URL=http://127.0.0.1:3001
```

Production — set `VITE_APP_URL` to your API origin and `VITE_PUBLIC_SHORT_URL` to your public short-link host. If you use the abuse admin UI, set `VITE_ADMIN_EMAILS` to match backend `ADMIN_EMAILS`. See [FRONTEND/.env.example](./FRONTEND/.env.example).

## Production (Vercel)

### Short-link routing

The frontend build generates `vercel.json` rewrites that proxy slug-shaped paths (`/^[a-zA-Z0-9_-]{3,20}$/`, excluding SPA routes) to `SHORT_LINK_PROXY_ORIGIN` (defaults to `VITE_APP_URL`). This mirrors the Vite dev proxy in `FRONTEND/vite.config.js`.

Set both env vars in your Vercel frontend project, then smoke-test a live slug after deploy:

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

The generated `vercel.json` includes `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and a report-only CSP.

Crawlers requesting `/` or `/privacy` receive route-specific Open Graph metadata via Vercel Edge Middleware ([`FRONTEND/middleware.js`](./FRONTEND/middleware.js)) and the build-time SEO shells.

## Documentation

| Resource | Contents |
| -------- | -------- |
| [/privacy](https://shortly.nayanswarnkar.com/privacy) (in-app) | Public privacy and analytics retention policy |
| [BACKEND/.env.example](./BACKEND/.env.example) | All backend environment variables |
| [FRONTEND/.env.example](./FRONTEND/.env.example) | All frontend environment variables |

## Architecture

```
FRONTEND/      React 19 + Vite SPA
BACKEND/       Express 5 API
  src/
    routes/        REST endpoints
    controllers/   request handling
    services/      business logic
      shortUrl/    persist, redirect, claim, capacity
      auth, account, analytics, email, click, abuse, …
    dao/           Mongo access layer
    schema/        User, ShortUrl, Click, RateLimit, AbuseReport
    middleware/    auth, csrf, rate limit, validation, latency
    validation/    Joi schemas
    utils/         authToken, slug/url helpers, error handling, mongoTransaction
```

Profile reads use `GET /api/auth/me` with `Cache-Control: no-store` so clients never show a stale display name after edits.

### Routes

| Path | Access | Page |
| ---- | ------ | ---- |
| `/` | Public | Landing |
| `/login`, `/register`, `/verify-email/:token`, `/forgot-password`, `/reset-password/:token` | Guest | Auth |
| `/dashboard`, `/settings` | Signed in | Dashboard, account settings |
| `/admin/abuse` | Admin | Abuse report review queue |
| `/privacy` | Public | Privacy policy |
| `/:short_url` | Public | Proxied redirect (dev: Vite → backend) |

### Frontend layout

| Area | Notes |
| ---- | ----- |
| `api/` | Axios clients |
| `contexts/` | `authSessionStore`, `AuthContext` with shared stats |
| `hooks/` | `useDashboard`, `useDashboardList`, `useDashboardMutations`, `useUrlStats` |
| `components/` | `app/`, `dashboard/`, `settings/`, `landing/`, `urlForm/`, `ux/`, … |
| `styles/domains/` | Design tokens; run `npm run css:check` after CSS edits |

**Session:** Bootstrap via `GET /api/auth/me`; profile saves call `PATCH /api/auth/me`, then `updateUser` + `refreshUser`.

**API responses:** Axios flattens `{ success, message, data: { … } }`. Use `getApiPayload`, `getApiUser`, `getApiMessage`, `getApiErrorMessage` from `FRONTEND/src/utils/axiosInstance.js`.

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
<summary><strong>3. Anonymous links: device-local until claimed</strong></summary>

Guests can shorten without an account. The backend returns a `manage_token`; the frontend stores `{ id, manage_token }` in `localStorage`. On sign-in, `/api/create/claim` transfers ownership.

**Tradeoff:** No way to recover guest links across browsers/devices without signing in. Clearing browser data loses manage access — the short link itself still works.

</details>

<details>
<summary><strong>4. Two rate-limit strategies, picked by path temperature</strong></summary>

- **DB-backed `rateLimiter`** (auth, custom-create, etc.) — accurate across instances, one extra Mongo round-trip per request.
- **In-memory `memoryRateLimiter`** for the redirect hot path — zero DB cost per redirect, not shared across instances.

Redirects read MongoDB directly so edits, disables, and retirements stay consistent across every backend instance.

</details>

<details>
<summary><strong>5. Permanent slug retirement</strong></summary>

Deleted links become permanent, non-identifying tombstones. The destination, owner, management token, and lifetime counter are scrubbed; the slug and retirement time remain so an old public URL can never be taken over. Retired links return HTTP 410.

</details>

<details>
<summary><strong>6. Redirect destination validation</strong></summary>

`isSafeRedirectUrl` accepts only HTTP(S) destinations and rejects `localhost` plus literal loopback, private, unspecified, and link-local IPv4/IPv6 addresses. The backend does not resolve DNS or fetch destination content. Validation runs when a destination is saved and before a redirect is returned.

</details>

## Security

- bcrypt password hashing; JWT in HTTP-only cookies with `tokenVersion` (invalidated on password change)
- Email verification gate when Resend is configured
- Joi validation on every input; CSRF checks on cookie-backed writes
- CORS with explicit origin allowlist (`FRONT_END_URL` + `ALLOWED_ORIGINS`)
- Per-endpoint rate limits, reserved-slug protection, redirect URL validation
- Helmet, gzip, request IDs, latency tracking, graceful shutdown
- Profile API responses are not cached (`no-store` on `/api/auth/me`)
- Abuse reports at `POST /api/abuse/report` (rate-limited); admin queue at `/api/admin/abuse` gated by `ADMIN_EMAILS`

## Testing

| Command | What it runs |
| ------- | ------------ |
| `npm run test:backend` | Node test runner + in-memory MongoDB replica set |
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

## License

[MIT](./LICENSE)
