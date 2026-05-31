# Shortly Frontend

React 19 + Vite 6 SPA for the [Shortly](https://shortly.nayan04.me/) URL
shortener.

## Prerequisites

- Node.js 18+
- Backend running on port 3001 (see repo root [README.md](../README.md))

## Setup

```bash
npm install
cp .env.example .env
```

### Environment variables

| Variable                | Dev                                              | Production               |
| ----------------------- | ------------------------------------------------ | ------------------------ |
| `VITE_APP_URL`          | Leave empty — Vite proxies `/api` to the backend | Backend API origin       |
| `VITE_PUBLIC_SHORT_URL` | `http://127.0.0.1:5173`                          | Public short-link domain |
| `VITE_BACKEND_DEV_URL`  | `http://127.0.0.1:3001`                          | Not used in prod builds  |

In development, cookies and API calls stay same-origin via the Vite proxy — no
CORS setup needed.

## Scripts

| Command             | Description                                   |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start dev server at `http://127.0.0.1:5173`   |
| `npm run build`     | Production build → `dist/`                    |
| `npm run preview`   | Preview production build                      |
| `npm run lint`      | ESLint                                        |
| `npm run css:check` | Assemble split CSS + verify design token sync |

From the repo root:

```bash
npm run dev:frontend
npm run build:frontend
npm run lint:frontend
npm run css:check
```

## Routes

| Path                     | Access    | Component        |
| ------------------------ | --------- | ---------------- |
| `/`                      | Public    | LandingPage      |
| `/login`                 | Guest     | LoginForm        |
| `/register`              | Guest     | RegisterForm     |
| `/verify-email/:token`   | Guest     | VerifyEmail      |
| `/forgot-password`       | Guest     | ForgotPassword   |
| `/reset-password/:token` | Guest     | ResetPassword    |
| `/dashboard`             | Protected | Dashboard        |
| `/settings`              | Protected | AccountSettings  |
| `/privacy`               | Public    | PrivacyPage      |
| `/:short_url`            | Public    | Proxied redirect |

## Project structure

```
src/
├── api/
│   ├── shortUrl.api.js   # Create, list, stats, claim, bulk delete, update
│   └── user.api.js       # Auth, verify/resend email, profile, password
├── components/
│   ├── app/              # App shell, navbar
│   ├── dashboard/        # Stats zone, links panel, charts, pagination
│   ├── landing/          # Hero, FAQ, features catalog, footer
│   ├── urlForm/          # URL shortening form pieces
│   ├── ux/               # Toasts, dialogs, offline banner, copy, …
│   ├── ClickAnalytics.jsx
│   ├── Dashboard.jsx
│   ├── VerifyEmail.jsx
│   ├── PrivacyPage.jsx
│   └── …
├── contexts/
│   └── AuthContext.jsx   # Session + claimStoredAnonymousLinks on login
├── hooks/
├── layouts/              # Auth, protected, guest-only, catalog shell
├── routes/
├── styles/
│   ├── domains/          # Split CSS by surface (tokens, dashboard, mobile, …)
│   └── shortly-design-tokens.css
└── utils/
    ├── anonymousLinks.js      # localStorage for guest manage_token + id
    ├── claimAnonymousLinks.js # POST /api/create/claim after sign-in
    └── axiosInstance.js
```

## Key flows

### Anonymous shortening

1. `UrlForm` calls `POST /api/create`.
2. Guest responses include `manage_token` → saved via `rememberAnonymousLink()`.
3. On login/register, `AuthContext` calls `claimStoredAnonymousLinks()` to
   attach links to the account.

Guest links are device-local. There is no guest delete UI — sign in to claim,
then manage/delete from the dashboard.

### Email verification

When the backend has `RESEND_API_KEY` configured:

1. Register shows a “Check your email” screen with **Resend verification
   email**.
2. Login with an unverified account shows the same resend option.
3. `/verify-email/:token` calls `POST /api/auth/verify-email`.

Without Resend, registration auto-verifies and logs in immediately.

### Dashboard analytics

- Overview stats from `GET /api/create/stats`.
- Per-account **Click analytics** tab: clicks over time (7D / 30D / All stored
  days), countries, devices/browsers/OS.
- Raw click events are retained server-side for up to 30 days; the chart note
  explaining this is hidden on mobile viewports.

## Design system

CSS is split under `src/styles/domains/`. The entry file
`shortly-design-tokens.css` imports them in order.

- **Source primitives:** `../Design/supermemory-ai-design-tokens.json`
- **Synced variables:** `../Design/supermemory-ai-variables.css` (checked by
  `css:check`)
- **Verify assembly:** `npm run css:check` — assembles domain files and checks
  key brand tokens still match the Design CSS

After editing domain CSS, run `css:check` before committing.

## API payloads

The axios response interceptor flattens `{ success, message, data: { … } }`
envelopes. API modules in `src/api/` return the flat payload directly. Use
helpers from `utils/axiosInstance.js`:

- `getApiPayload(response)` — normalize axios response or module return
- `getApiUser(payload)` — read `user` field
- `getApiMessage(payload, fallback)` — read `message` field
- `getApiErrorMessage(err, fallback)` — read error message from failed requests

## Dev notes

- Short links (`/abc123`) are proxied to the backend in dev so redirects work on
  port 5173.
- React Grab loads only in development (`src/dev/`).
- Scrollbar hiding uses the hand-written `.scrollbar-hide` utility in
  `index.css`.
