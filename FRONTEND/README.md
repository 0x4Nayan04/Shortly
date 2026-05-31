# Shortly Frontend

React 19 + Vite 6 SPA for the [Shortly](https://shortly.nayan04.me/) URL
shortener.

## Prerequisites

- Node.js 18+
- Backend running on port 3001 (see repo root `README.md`)

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
| `npm run dev`       | Start dev server at `http://localhost:5173`   |
| `npm run build`     | Production build → `dist/`                    |
| `npm run preview`   | Preview production build                      |
| `npm run lint`      | ESLint                                        |
| `npm run css:check` | Assemble split CSS + verify design token sync |

From the repo root:

```bash
npm run dev:frontend
npm run build:frontend
npm run lint:frontend
```

## Project structure

```
src/
├── api/              # Axios API modules (return flat merged payloads)
├── components/
│   ├── app/          # App shell, navbar
│   ├── dashboard/    # Dashboard zones, charts, pagination
│   ├── landing/      # Marketing pages
│   ├── urlForm/      # URL shortening form pieces
│   └── ux/           # Toasts, dialogs, offline banner, etc.
├── contexts/         # AuthContext
├── hooks/            # Shared hooks (form validation, unsaved guard, …)
├── layouts/          # Route layouts (auth, catalog shell, …)
├── routes/           # React Router config
├── styles/
│   ├── domains/      # Split CSS by surface (tokens, auth, dashboard, …)
│   └── shortly-design-tokens.css  # Entry that @imports domains
└── utils/            # axiosInstance, validation, helpers
```

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

## Dev notes

- Short links (`/abc123`) are proxied to the backend in dev so redirects work on
  port 5173.
- React Grab loads only in development (`src/dev/`).
- Scrollbar hiding uses the hand-written `.scrollbar-hide` utility in
  `index.css`.
