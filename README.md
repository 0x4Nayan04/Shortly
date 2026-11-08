# Shortly

A self-hostable URL shortener with guest links, custom aliases, QR codes, and a dashboard for managing links and understanding clicks.

<img src="./FRONTEND/public/assets/Shortly_Logo_nav.webp" alt="Shortly logo" height="40" />

[Try Shortly](https://shortly.nayanswarnkar.com/) · [Short-link domain](https://s.nayanswarnkar.com/) · [Privacy policy](https://shortly.nayanswarnkar.com/privacy) · [MIT license](./LICENSE)

Built as a full-stack portfolio and learning project with React, Express, and MongoDB. The repository includes the application, automated tests, and Vercel frontend routing. It is maintained by one author; it does not promise hosted-service uptime or multi-region operation.

Instead of relying on a hosted shortener, you can run the application and keep link ownership and analytics in your own MongoDB database. Guests can shorten a URL immediately and claim it after signing in. Detailed click events expire after 30 days; the link's lifetime counter remains until the link is deleted.

[Watch the demo](./FRONTEND/public/demo/demo.mp4)

## Run locally

Use **Node.js 22** (the version used in CI), npm, and a **MongoDB replica set**, such as MongoDB Atlas. A standalone MongoDB server cannot support the transactions used for signed-in link creation, click recording, and account deletion. For Atlas, allow your development machine's IP and create a database user with access to the database.

```bash
git clone https://github.com/0x4Nayan04/Shortly.git
cd Shortly
npm ci
npm run install:all
cp FRONTEND/.env.example FRONTEND/.env
```

Create `BACKEND/.env` with the following values. Replace the MongoDB URI and use your own JWT secret of at least 32 characters:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/url_shortener
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
FRONT_END_URL=http://127.0.0.1:5173
PUBLIC_BASE_URL=http://127.0.0.1:3001
PORT=3001
NODE_ENV=development
RESEND_API_KEY=
```

Start the API and frontend in **two separate terminals**, both from the repository root:

```bash
# Terminal 1
npm run dev:backend
```

```bash
# Terminal 2
npm run dev:frontend
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Keep `VITE_APP_URL` empty for local development; Vite proxies `/api` requests and short-link paths to the API on port 3001.

Paste a public HTTP(S) URL, shorten it, and use **Copy** to get the full URL. The result field hides `http://` or `https://` for display; copying and sharing keep the scheme. Opening the copied link returns an HTTP `302` redirect to the destination.

With `RESEND_API_KEY` empty, development registration marks the email verified; sign in separately afterward. Email verification, password-reset delivery, and cross-device claim emails need a configured Resend account. If you use [BACKEND/.env.example](./BACKEND/.env.example) instead, remove its placeholder Resend key and optional webhook URL before running locally.

Verify the API is ready:

```bash
curl --fail http://127.0.0.1:3001/api/health/ready
```

A successful response has `success: true` and `data.mongo.connected: true`. `/api/health` also checks readiness; `/api/health/live` checks whether the API process is running.

## What you can do

- **Shorten as a guest:** generate a seven-character slug without an account. The browser keeps a management token for claiming the link when you sign in. An optional one-time email claim link supports another device.
- **Create custom aliases:** signed-in users can choose 3–20 characters, starting with a letter or number, using letters, digits, hyphens, and underscores. Slugs are normalized to lowercase; reserved application paths are unavailable.
- **Manage links:** change destinations or aliases, disable and re-enable links, or delete individual links and bulk selections. Changing an alias replaces its URL; the old alias is not kept as a forwarding address.
- **Reuse existing links:** ordinary signed-in shortening reuses the user's existing link for the same normalized destination. Custom-alias creation is a separate flow. Accounts default to a limit of 1,000 active links, configurable with `MAX_LINKS_PER_USER`.
- **Explore the dashboard:** search by case-sensitive URL or alias prefix, sort and page through links, copy and share them, and generate QR codes.
- **Read analytics:** see lifetime click totals, recent activity, top links, and 30-day breakdowns by date, country, device, browser, operating system, and referrer hostname.
- **Manage an account:** update the profile name, change the password, verify email, reset a forgotten password, and delete the account. Passwords require at least 12 characters. Confirmed sign-out returns to the landing page.

The landing and authentication pages send signed-in users to `/dashboard`. `/dashboard`, `/settings`, and `/claim-link/:token` require a session; `/privacy` is public.

## Stack and project structure

| Layer                 | Technologies                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------- |
| Frontend              | React 19, Vite 6, Tailwind CSS 4, React Router 7, TanStack Query 5, Axios, Lucide, qrcode |
| API                   | Node.js, Express 5, Mongoose 8, Joi, bcrypt, JWT, Resend, Helmet                          |
| Storage and analytics | MongoDB, geoip-lite, ua-parser-js                                                         |
| Tests                 | Vitest, Testing Library, Playwright, Node test runner, mongodb-memory-server              |

```text
Shortly/
├── FRONTEND/
│   ├── src/
│   │   ├── api/          API clients
│   │   ├── components/   Landing, auth, dashboard, settings, and shared UI
│   │   ├── contexts/     Authentication and session state
│   │   ├── hooks/        Forms, dashboard queries, and mutations
│   │   ├── layouts/      Route guards and page shells
│   │   ├── routes/       Application routes
│   │   └── styles/       Design tokens and domain styles
│   ├── config/           Short-link routing, metadata, and security headers
│   ├── scripts/          Build generation and routing smoke checks
│   └── e2e/              Playwright scenarios
├── BACKEND/
│   ├── index.js          Startup, database connection, and shutdown
│   ├── src/
│   │   ├── routes/       Auth, link, and health endpoints
│   │   ├── controllers/  HTTP input and response handling
│   │   ├── services/     Link lifecycle, accounts, email, and analytics
│   │   ├── dao/          Database queries
│   │   ├── schema/       User, ShortUrl, Click, and RateLimit models
│   │   ├── middleware/   Auth, CSRF, validation, rate limits, and timing
│   │   └── validation/   Joi request schemas
│   ├── scripts/          Isolated E2E server and index repair
│   └── test/             Backend tests
└── .github/workflows/    Frontend and backend CI
```

The browser calls the Express API, which passes requests through controllers, services, and database access functions to MongoDB. In development, Vite proxies API requests and short-link redirects. In production, the frontend calls the configured API origin directly; Vercel rewrites short-link paths to the backend.

```mermaid
flowchart LR
  Browser[Browser] --> Frontend[React frontend]
  Frontend -->|API requests| API[Express API]
  Browser -->|Short-link URL| Proxy[Vite or Vercel proxy]
  Proxy -->|Slug lookup| API
  API --> Mongo[(MongoDB replica set)]
  API -->|302 Location response| Browser
  Browser -->|Follow Location| Destination[Destination website]
```

## How links and analytics work

**Redirects and click recording.** The API resolves a slug, checks whether it is disabled or retired, validates the destination, and sends a `302`. Click recording runs after the response finishes, so a database write does not delay the redirect. Known bot user-agents are skipped. Recording is best effort: database failures or process termination can lose events; counts are not a billing-grade audit log.

**Retention and ownership.** MongoDB expires detailed click events with a 30-day TTL index; cleanup is asynchronous. Link counters are separate and are not expired by that index. Deleting a link removes its click events in the same transaction as retirement; previously retired ownerless links cannot be linked back to an account and their remaining events expire under the existing TTL. Analytics queries are scoped to the user's non-retired links. Guest management tokens are stored hashed on the server and raw in browser `localStorage`. Clearing browser data before claiming a link loses local management access unless you saved an email claim link; the short URL still works.

**Deletion and disabling.** Disabling is reversible and returns `410 Gone`. Deletion scrubs the link's destination, owner, tokens, and counter while retaining its slug and retirement time. Deleted slugs also return `410` and cannot be reused. Account deletion removes the account and its click events and retires its links.

**Caching.** Redirect lookups use a bounded, process-local cache with a **10-second TTL**. Auth-user lookups and dashboard overview/analytics use **30-second TTLs**. Mutations invalidate relevant entries in the process handling the write; other instances can serve stale entries until expiry. There is no shared cache or cross-instance invalidation. Frontend dashboard lists stay fresh for 15 seconds and stats for 30 seconds; overview and detailed analytics use separate requests, fetched on `/dashboard`.

**Rate limits and search.** Auth, creation, claims, and stats use MongoDB-backed rate limits with separate policy namespaces. Redirects use an in-memory per-IP limit that is independent on each API instance. Dashboard search uses indexed, case-sensitive prefix matching rather than substring or fuzzy search.

## Security and data handling

- Passwords are hashed with bcrypt. Sessions use JWTs in HTTP-only cookies with a one-day lifetime and a token version for revocation on logout or password changes. Auth caching means another API process can take up to 30 seconds to observe revocation.
- Joi validates requests; ownership checks protect link and account operations. Cookie-backed writes have CSRF protection, and CORS uses configured frontend origins.
- Redirect destinations must use HTTP(S). Validation rejects localhost and specified private, loopback, and link-local literal IP ranges, on save and redirect. It does not resolve DNS or fetch destinations and is not a malware scanner.
- Click records store country, referrer hostname, user-agent, and derived device/browser/OS details, without a visitor-IP field. Request IPs are used for geolocation and rate limiting; authentication still uses session cookies.
- Helmet headers, response compression, request IDs, request timing, and graceful shutdown are configured on the API. See the in-app [privacy policy source](./FRONTEND/src/components/PrivacyPage.jsx) for data-handling details.

## Deployment configuration

The frontend includes Vercel routing and crawler metadata support. Run the backend as a Node service connected to a MongoDB replica set. Deployment is separate from local setup; these instructions do not provision hosting.

| Where          | Variable                              | Purpose                                                                                                            |
| -------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Backend        | `NODE_ENV=production`                 | Enables production checks and secure session cookies                                                               |
| Backend        | `MONGODB_URI`, `JWT_SECRET`, `PORT`   | Database, signing secret of at least 32 characters, and listening port                                             |
| Backend        | `FRONT_END_URL`                       | Public frontend origin and email-link base                                                                         |
| Backend        | `ALLOWED_ORIGINS`                     | Optional comma-separated CORS origins; replaces the default origin list when set                                   |
| Backend        | `PUBLIC_BASE_URL`                     | Public short-link origin; required in production                                                                   |
| Backend        | `TRUST_PROXY`                         | Required in production; configure for the actual proxy topology (`1` for one trusted hop, `0` for direct exposure) |
| Backend        | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Required in production; use a sender configured in Resend                                                          |
| Backend        | `EMAIL_ASSET_BASE_URL`                | Optional public origin for email images; needed when the frontend URL is local                                     |
| Backend        | `OPERATIONS_ALERT_WEBHOOK_URL`        | Optional delivery-failure alert webhook                                                                            |
| Frontend build | `VITE_APP_URL`                        | Required API origin                                                                                                |
| Frontend build | `VITE_PUBLIC_SHORT_URL`               | Public short-link origin for display, copy, QR, and generated SEO URLs                                             |
| Frontend build | `SHORT_LINK_PROXY_ORIGIN`             | Backend target for Vercel short-link rewrites; defaults to `VITE_APP_URL`                                          |

Full examples: [backend environment](./BACKEND/.env.example) · [frontend environment](./FRONTEND/.env.example).

Use HTTPS and same-site frontend/API subdomains for the default `SameSite=Lax` cookies. An intentional cross-site setup requires `COOKIE_SAME_SITE=none`, secure cookies, and browsers that allow those cookies. Keep secrets on the backend; `VITE_*` values are public frontend configuration.

Set frontend variables in the **build process environment**, such as Vercel project settings or shell exports. The configuration generator runs before Vite and does not load `.env` files itself:

```bash
export VITE_APP_URL=https://api.example.com
export VITE_PUBLIC_SHORT_URL=https://s.example.com
export SHORT_LINK_PROXY_ORIGIN=https://api.example.com
npm run build:frontend
```

This generates `FRONTEND/vercel.json` rewrites and security headers, builds `FRONTEND/dist`, then generates crawler HTML shells, `sitemap.xml`, and `robots.txt`. Configure the Vercel project root as `FRONTEND`, build command as `npm run build`, and output directory as `dist`. Its middleware serves crawler metadata for `/` and `/privacy`. `VITE_PUBLIC_SHORT_URL` also supplies the generated canonical/SEO origin; there is no separate marketing-origin setting.

Start the configured backend with `npm run start:backend`. Monitor `/api/health/live` for liveness and `/api/health/ready` for database readiness.

After deployment, check routing with an existing active slug, replacing the example hosts and `your-slug`:

```bash
PUBLIC_SHORT_HOST=https://s.example.com \
SHORT_LINK_PROXY_ORIGIN=https://api.example.com \
npm run smoke:routing --prefix FRONTEND -- your-slug
```

Without a slug, the script checks routing configuration and backend health only. It does not verify a public redirect.

## Tests and development commands

Run these from the repository root:

| Command                                          | What it does                                                           |
| ------------------------------------------------ | ---------------------------------------------------------------------- |
| `npm run test:backend`                           | Node tests; database tests start disposable MongoDB replica sets       |
| `npm run test:frontend`                          | Vitest and Testing Library tests                                       |
| `npm run test:all`                               | Backend and frontend unit/integration tests                            |
| `npm run test:e2e`                               | Playwright Chromium scenarios against a test API and Vite              |
| `npm run lint:backend` / `npm run lint:frontend` | ESLint                                                                 |
| `npm run css:check`                              | Checks assembled design CSS                                            |
| `npm run build:frontend`                         | Generates deployment config, builds the frontend, and writes SEO files |
| `npm run format:check` / `npm run format`        | Checks or applies repository-wide Prettier formatting                  |

Install Chromium before the first E2E run:

```bash
cd FRONTEND
npx playwright install chromium
cd ..
npm run test:e2e
```

On Linux CI, use `npx playwright install --with-deps chromium`. Database tests may download a MongoDB binary on first use. The E2E configuration starts an isolated API on **3011** and Vite on **5173**; stop your development servers first, because local runs can reuse an already-running server and test the wrong backend.

The [backend workflow](./.github/workflows/backend-ci.yml) runs lint, tests, and a dependency audit. The [frontend workflow](./.github/workflows/frontend-ci.yml) runs unit tests and Playwright on Node 22. Additional frontend commands include `npm run doctor` and `npm run check` from `FRONTEND/`; `check` also builds, so it needs the production build variables above.

Licensed under [MIT](./LICENSE).
