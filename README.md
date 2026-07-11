# Shortly

> Privacy-first URL shortener with click analytics, custom aliases, and a dashboard.
> Built to learn end-to-end full-stack development with React, Express, and MongoDB.

**Live demo:** Deploy the frontend and backend with your own domains (see environment examples below).

<p align="left">
  <img src="https://img.shields.io/badge/status-portfolio-blue" alt="Status" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  <img src="https://img.shields.io/badge/node-18%2B-339933" alt="Node" />
  <img src="https://img.shields.io/badge/mongo-replica%20set-47A248" alt="MongoDB" />
</p>

<video src="./FRONTEND/public/demo/demo.mp4" width="1280" autoplay loop muted playsinline>
  <a href="./FRONTEND/public/demo/demo.mp4">Watch the Shortly demo</a>
</video>

## Features

- Shorten URLs as a guest — no account required
- Sign in to claim guest links into your dashboard automatically
- Custom aliases (3–20 chars)
- Click analytics: clicks over time, top countries, device, browser, OS
- Dashboard with search, sort, pagination, bulk delete, QR codes
- Account settings: profile name, password, account deletion
- Email verification, password reset (Resend)
- Tiered per-endpoint rate limiting

## Tech stack

**Frontend** — React 19, Vite 6, Tailwind CSS 4, React Router, Axios,
react-hot-toast, lucide-react, qrcode.

**Backend** — Node.js, Express 5, MongoDB + Mongoose 8, JWT (HTTP-only cookies),
bcrypt, Joi, Resend, Helmet, geoip-lite, ua-parser-js.

## Quick start

```bash
git clone https://github.com/0x4Nayan04/Shortly.git
cd Shortly
npm run install:all
```

Copy and edit environment files (see full lists in the examples below):

```bash
cp BACKEND/.env.example BACKEND/.env
cp FRONTEND/.env.example FRONTEND/.env
```

**Backend** (`BACKEND/.env`) — minimum:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/url_shortener
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
FRONT_END_URL=http://127.0.0.1:5173
PORT=3001
NODE_ENV=development
```

Optional but useful: `PUBLIC_BASE_URL`, `ALLOWED_ORIGINS`, `RESEND_API_KEY`,
`RESEND_FROM_EMAIL`, `EMAIL_ASSET_BASE_URL`. See [BACKEND/.env.example](./BACKEND/.env.example).

**Frontend** (`FRONTEND/.env`) — development:

```env
# Leave empty in dev — Vite proxies /api to the backend
VITE_APP_URL=
VITE_PUBLIC_SHORT_URL=http://127.0.0.1:5173
VITE_BACKEND_DEV_URL=http://127.0.0.1:3001
```

For production builds, set `VITE_APP_URL` to your API origin (e.g.
`https://api.example.com`) and `VITE_PUBLIC_SHORT_URL` to your public short-link
host (e.g. `https://shortly.example.com`). See
[FRONTEND/.env.example](./FRONTEND/.env.example).

**Production short-link routing:** The frontend build generates `vercel.json`
rewrites that proxy slug-shaped paths (`/^[a-zA-Z0-9_-]{3,20}$/`, excluding SPA
routes) to `SHORT_LINK_PROXY_ORIGIN` (defaults to `VITE_APP_URL`). This mirrors
the Vite dev proxy in `FRONTEND/vite.config.js`. On Vercel, set both env vars
in the frontend project. After deploy, smoke-test a live slug:

```bash
PUBLIC_SHORT_HOST=https://shortly.example.com \
SHORT_LINK_PROXY_ORIGIN=https://api.example.com \
npm run smoke:routing --prefix FRONTEND your-slug
```

**Production security headers:** The frontend build also writes baseline
`Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, and a report-only CSP into
`vercel.json`. Crawlers requesting `/` receive route-specific Open Graph metadata via Vercel Edge Middleware and
build-time SEO shells in `dist/_seo/`.

Then in two terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Open <http://127.0.0.1:5173>.

> Click analytics use MongoDB transactions, so the DB must be a replica set
> (Atlas works). A standalone local MongoDB will still redirect, but click
> recording may fail.
>
> `RESEND_API_KEY` is optional in dev. Without it, registration auto-verifies
> and logs the user in immediately.

## Documentation

| Doc                                              | Contents                           |
| ------------------------------------------------ | ---------------------------------- |
| [BACKEND/.env.example](./BACKEND/.env.example)   | All backend environment variables  |
| [FRONTEND/.env.example](./FRONTEND/.env.example) | All frontend environment variables |

## Architecture

```
FRONTEND/      React 19 + Vite SPA (see FRONTEND layout below)
BACKEND/       Express 5 API
  src/
    routes/        REST endpoints
    controllers/   request handling
    services/      business logic
      shortUrl/    persist, redirect, claim, capacity (split from monolith)
      auth, account, analytics, email, click, …
    dao/           Mongo access layer
    schema/        Mongoose models (User, ShortUrl, Click, RateLimit)
    middleware/    auth, csrf, rate limit, validation, latency
    validation/    Joi schemas
    utils/         authToken, slug/url helpers, error handling, validation
                   mongoTransaction
```

Profile reads use `GET /api/auth/me` with `Cache-Control: no-store` so clients
never show a stale display name after edits.

### Frontend (`FRONTEND/src`)

| Path                                                                                        | Access    | Page                                   |
| ------------------------------------------------------------------------------------------- | --------- | -------------------------------------- |
| `/`                                                                                         | Public    | Landing                                |
| `/login`, `/register`, `/verify-email/:token`, `/forgot-password`, `/reset-password/:token` | Guest     | Auth                                   |
| `/dashboard`, `/settings`                                                                   | Signed in | Dashboard, account settings            |
| `/:short_url`                                                                               | Public    | Proxied redirect (dev: Vite → backend) |

**Layout:** `api/` (axios clients), `contexts/` (`authSessionStore` +
`AuthContext` with shared stats), `hooks/` (`useDashboard`, `useDashboardList`,
`useDashboardMutations`, `useUrlStats`), `components/` (`app/`, `dashboard/`,
`settings/`, `landing/`, `urlForm/`, `ux/`, …), `styles/domains/` + design tokens.

**Session:** Bootstrap via `GET /api/auth/me`; profile saves call `PATCH /api/auth/me`,
then `updateUser` + `refreshUser` so the navbar shows the new name.

**API responses:** Axios flattens `{ success, message, data: { … } }`. Use
`getApiPayload`, `getApiUser`, `getApiMessage`, `getApiErrorMessage` from
`FRONTEND/src/utils/axiosInstance.js`.

**CSS:** Domain files under `styles/domains/`; run `npm run css:check` from the
repo root after token/CSS edits (syncs with `Design/` variables when present).

## Design tradeoffs

These are intentional product/engineering decisions — useful context for
reviewers and interviews.

### 1. Fast redirects over exact click counts

The redirect handler sends `302` first, then records the click asynchronously
after the response finishes (`res.once('finish', recordClick)`). This keeps
links fast for visitors.

**Tradeoff:** If a visitor closes the tab immediately after the redirect
resolves, the visit may never be recorded. We prioritize perceived speed
over perfectly exact counts. Bot user-agents are excluded from recording
entirely.

### 2. 30-day analytics window, but lifetime click totals

Raw click events (country, device, browser, referrer, daily chart) live in a
`clicks` collection with a MongoDB TTL index and are auto-deleted after 30
days. The link's `click` counter, however, is incremented transactionally on
every recorded redirect and is **not** tied to the TTL window — so total
clicks on a link are lifetime, but the breakdown charts only cover the last
30 days.

### 3. Anonymous links: device-local until claimed

Guests can shorten without an account. The backend returns a `manage_token`;
the frontend stores `{ id, manage_token }` in `localStorage`. On sign-in, the
`/api/create/claim` flow transfers ownership and unsets the manage token.

**Tradeoff:** No way to recover guest links across browsers/devices without
signing in. Clearing browser data loses manage access — the short link itself
still works.

### 4. Two rate-limit strategies, picked by path temperature

- **DB-backed `rateLimiter`** (auth, custom-create, etc.) — accurate across
  instances, but one extra Mongo round-trip per request.
- **In-memory `memoryRateLimiter`** for the redirect hot path — zero DB cost
  per redirect, at the cost of not being shared across instances.

Redirects read MongoDB directly so edits, disables, and retirements are
consistent across every backend instance.

### 5. Permanent slug retirement

Deleted links become permanent, non-identifying tombstones. The destination,
owner, management token, and lifetime counter are scrubbed, while the slug and
retirement time remain so an old public URL can never be taken over. Retired
links return HTTP 410 and are excluded from dashboards and analytics.

### 6. Redirect destination validation

`isSafeRedirectUrl` accepts only HTTP(S) destinations and rejects `localhost`
plus literal loopback, private, unspecified, and link-local IPv4/IPv6 addresses,
including IPv4-mapped IPv6 forms. Hostnames are checked syntactically; the
backend does not resolve DNS and never fetches destination content. Validation
runs both when a destination is saved and before a redirect is returned.

## Security

- bcrypt password hashing; JWT in HTTP-only cookies with `tokenVersion`
  (sessions are invalidated on password change)
- Email verification gate when Resend is configured
- Joi validation on every input, CSRF checks on cookie-backed writes
- CORS with explicit origin allowlist (`FRONT_END_URL` + `ALLOWED_ORIGINS`)
- Per-endpoint rate limits, reserved-slug protection, and protocol/literal
  private-address redirect validation
- Helmet, gzip, request IDs, latency tracking, graceful shutdown
- User profile API responses are not cached (`no-store` on `/api/auth/me`)

## Root scripts

| Command                  | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `npm run install:all`    | Install backend + frontend dependencies             |
| `npm run dev:backend`    | Start API with nodemon                              |
| `npm run dev:frontend`   | Start Vite dev server                               |
| `npm run build:frontend` | Production frontend build (`VITE_APP_URL` required) |
| `npm run lint:frontend`  | ESLint (frontend)                                   |
| `npm run lint:backend`   | ESLint (backend)                                    |
| `npm run css:check`      | Assemble CSS + verify design tokens (frontend)      |
| `npm run format`         | Prettier — format tracked source/docs               |
| `npm run format:check`   | Prettier — verify formatting (CI-friendly)          |

## License

[MIT](./LICENSE)
