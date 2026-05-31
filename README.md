# Shortly - URL Shortener Application

A privacy-first URL shortener that converts long URLs into short, shareable
links with click analytics. Live at
[shortly.nayan04.me](https://shortly.nayan04.me/).

## Features

- **URL Shortening** — Convert long URLs to short links (no account required)
- **Anonymous → account** — Guest links are saved on-device; sign in to claim
  them into your dashboard
- **Custom Aliases** — Personalized short URLs (3–20 chars, signed-in users)
- **Click Tracking** — Per-link and account-wide statistics
- **Click Analytics** — Clicks over time, top countries, device/browser/OS
  breakdowns (raw click events retained up to 30 days)
- **URL Management** — View, search, sort, copy, share, edit, and delete links
- **Bulk Delete** — Select and delete multiple URLs at once
- **QR Codes** — Generate QR codes for any short URL (SVG or PNG)
- **Dashboard** — Stats overview, recent activity, top URLs, and analytics tab
- **Authentication** — Register, email verification, login, HTTP-only cookie
  sessions
- **Password Management** — Change password (authenticated), forgot/reset via
  email
- **Account Settings** — Profile, password, email verification status, account
  deletion
- **Privacy Page** — Public summary of data collection and retention
- **Rate Limiting** — Tiered per-endpoint limits to reduce abuse

## Architecture

### Frontend (React + Vite)

```
FRONTEND/
├── src/
│   ├── api/                 # shortUrl.api.js, user.api.js
│   ├── components/
│   │   ├── app/             # App shell, navbar
│   │   ├── dashboard/       # Stats, links panel, charts, pagination
│   │   ├── landing/         # Marketing, FAQ, features catalog
│   │   ├── urlForm/         # Shortening form pieces
│   │   ├── ux/              # Toasts, dialogs, offline banner, …
│   │   ├── ClickAnalytics.jsx
│   │   ├── Dashboard.jsx
│   │   ├── UrlForm.jsx
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   ├── VerifyEmail.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── AccountSettings.jsx
│   │   ├── PrivacyPage.jsx
│   │   └── …
│   ├── contexts/            # AuthContext (incl. anonymous link claim)
│   ├── hooks/
│   ├── layouts/
│   ├── routes/
│   ├── styles/domains/      # Split CSS (tokens, dashboard, landing, …)
│   └── utils/               # axiosInstance, anonymousLinks, validation, …
└── public/
```

### Backend (Node.js + Express)

```
BACKEND/
├── index.js
└── src/
    ├── controllers/
    ├── schema/              # User, ShortUrl, Click, RateLimit
    ├── dao/
    ├── services/            # auth, shortUrl, analytics, email
    ├── routes/
    ├── middleware/
    ├── validation/
    ├── templates/           # Transactional email HTML/text
    ├── utils/
    └── config/
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas or another cloud/replica-set MongoDB
- npm

### 1. Clone the Repository

```bash
git clone https://github.com/0x4Nayan04/Shortly.git
cd Shortly
```

### 2. Install Dependencies (Backend + Frontend)

```bash
npm run install:all
```

### 3. Backend Setup

```bash
cd BACKEND
cp .env.example .env
```

Minimum `.env`:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/url_shortener
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
FRONT_END_URL=http://127.0.0.1:5173
PORT=3001
NODE_ENV=development
```

> Click analytics use MongoDB transactions. Use Atlas or another replica-set
> deployment. A plain standalone local MongoDB can still redirect, but click
> recording may fail.

**Email (optional in dev, required in production):**

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=Shortly <noreply@yourdomain.com>
EMAIL_ASSET_BASE_URL=https://your-production-domain.com
```

When `RESEND_API_KEY` is **unset**, registration skips email verification and
logs the user in immediately. When set, new accounts must verify email before
login.

### 4. Frontend Setup

```bash
cd FRONTEND
cp .env.example .env
```

```env
VITE_APP_URL=
VITE_PUBLIC_SHORT_URL=http://127.0.0.1:5173
VITE_BACKEND_DEV_URL=http://127.0.0.1:3001
```

### 5. Run the Application

**Backend:**

```bash
cd BACKEND
npm run dev
```

**Frontend (new terminal):**

```bash
cd FRONTEND
npm run dev
```

**Root helpers:**

```bash
npm run dev:backend
npm run dev:frontend
npm run lint:backend
npm run lint:frontend
npm run css:check
```

Open `http://127.0.0.1:5173` to use Shortly.

## Environment Variables

### Backend (`BACKEND/.env.example`)

| Variable             | Required   | Description                                                               |
| -------------------- | ---------- | ------------------------------------------------------------------------- |
| MONGODB_URI          | Yes        | MongoDB Atlas/cloud replica-set connection string                         |
| JWT_SECRET           | Yes        | JWT signing secret (min 32 chars)                                         |
| FRONT_END_URL        | Yes        | Frontend origin for CORS, cookies, and email links                        |
| PORT                 | Yes        | Server port                                                               |
| NODE_ENV             | No         | `development` or `production`                                             |
| PUBLIC_BASE_URL      | Production | Public origin for short links/QR when API host differs from redirect host |
| ALLOWED_ORIGINS      | No         | Comma-separated extra CORS origins (defaults to `FRONT_END_URL`)          |
| RESEND_API_KEY       | Production | Resend API key for verification and password-reset emails                 |
| RESEND_FROM_EMAIL    | Production | Verified sender address (e.g. `Shortly <noreply@yourdomain.com>`)         |
| EMAIL_ASSET_BASE_URL | No         | Public URL for email logo assets when `FRONT_END_URL` is localhost        |
| MONGODB_IP_FAMILY    | No         | `4` or `6`; omit for system default                                       |

### Frontend (`FRONTEND/.env.example`)

| Variable              | Required | Description                                               |
| --------------------- | -------- | --------------------------------------------------------- |
| VITE_APP_URL          | Prod     | Backend API origin; leave empty in dev for the Vite proxy |
| VITE_PUBLIC_SHORT_URL | Yes      | Public short-link origin used for copy/share/QR           |
| VITE_BACKEND_DEV_URL  | Dev      | Backend origin for Vite's local proxy                     |

## Production Deployment

### Backend

1. Set environment variables (`NODE_ENV=production`, `PUBLIC_BASE_URL`,
   `RESEND_*`, etc.).
2. `npm install`
3. `npm start`

### Frontend

1. Set `VITE_APP_URL` to your backend API URL.
2. Set `VITE_PUBLIC_SHORT_URL` to the domain that reaches the backend redirect
   route (`GET /:short_url`).
3. `npm run build` → output in `dist/`

### Deployment Notes

- **Auth cookies**: In production with cross-origin frontend/API, use
  `sameSite: 'none'` and `secure: true`. Cookie-backed writes validate
  `Origin`/`Referer` — keep frontend origins exact.
- **CORS**: Set `FRONT_END_URL` to your frontend domain; use `ALLOWED_ORIGINS`
  for additional origins.
- **MongoDB**: Include the database name in the connection string; whitelist
  deployment IPs in Atlas.
- **Email**: Verify your sending domain in Resend. Set `FRONT_END_URL` to your
  public frontend so verification/reset links work outside localhost.
- **Short links**: Do not point `VITE_PUBLIC_SHORT_URL` at a static SPA-only
  host unless it proxies root slug paths to the backend.

## API Documentation

### Base URL

- Development: `http://localhost:3001` (or via Vite proxy at `/api`)

### Authentication

| Method | Endpoint                      | Auth | Description                                          |
| ------ | ----------------------------- | ---- | ---------------------------------------------------- |
| POST   | /api/auth/register            | No   | Register user                                        |
| POST   | /api/auth/verify-email        | No   | Verify email with token                              |
| POST   | /api/auth/resend-verification | No   | Resend verification email                            |
| POST   | /api/auth/login               | No   | Login (requires verified email if Resend configured) |
| POST   | /api/auth/logout              | Yes  | Logout                                               |
| GET    | /api/auth/me                  | Yes  | Get profile                                          |
| PATCH  | /api/auth/me                  | Yes  | Update profile                                       |
| DELETE | /api/auth/me                  | Yes  | Delete account                                       |
| POST   | /api/auth/change-password     | Yes  | Change password                                      |
| POST   | /api/auth/forgot-password     | No   | Request password reset                               |
| POST   | /api/auth/reset-password      | No   | Reset password with token                            |

### URL Shortening

| Method | Endpoint            | Auth | Description                                       |
| ------ | ------------------- | ---- | ------------------------------------------------- |
| POST   | /api/create         | No\* | Create short URL (\*optional auth attaches owner) |
| POST   | /api/create/custom  | Yes  | Create custom short URL                           |
| POST   | /api/create/claim   | Yes  | Claim anonymous links created on this device      |
| GET    | /api/create/my-urls | Yes  | List user URLs (search, sort, pagination)         |
| GET    | /api/create/stats   | Yes  | Account stats and click analytics                 |
| PATCH  | /api/create/:id     | Yes  | Update destination, alias, or disabled state      |
| DELETE | /api/create/:id     | Yes  | Delete single URL                                 |
| DELETE | /api/create/bulk    | Yes  | Bulk delete URLs                                  |
| GET    | /api/qr/:short_url  | No   | QR code image (`?format=png` or `svg`)            |
| GET    | /:short_url         | No   | Redirect to original URL                          |
| GET    | /api/health         | No   | Health check                                      |

### Example: Create Short URL (guest)

```http
POST /api/create
Content-Type: application/json

{
  "full_url": "https://www.example.com/very/long/url/path"
}
```

Guest response includes `manage_token` (stored in browser `localStorage` for
claim-on-sign-in). Signed-in users get the link attached to their account
directly.

### Example: Claim Anonymous Links

```http
POST /api/create/claim
Content-Type: application/json
Cookie: token=<jwt>

{
  "links": [
    { "id": "<urlId>", "manage_token": "<token>" }
  ]
}
```

### Example: Resend Verification Email

```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "you@example.com"
}
```

### Example: Get User URLs

```http
GET /api/create/my-urls?limit=20&skip=0&search=example&sortBy=createdAt&sortOrder=desc
Cookie: token=<jwt>
```

## Tech Stack

### Frontend

- React 19, Vite 6, Tailwind CSS 4
- React Router, Axios
- react-hot-toast, lucide-react, qrcode

### Backend

- Node.js, Express 5, MongoDB, Mongoose 8
- JWT, bcrypt, nanoid, Joi, Resend
- Helmet, compression, cookie-parser, geoip-lite

### Development

- ESLint, Nodemon, dotenv

## Usage

### Anonymous Users

1. Visit the homepage and paste a long URL.
2. Copy and share the short link immediately.
3. The link is remembered on this device only.
4. **Sign in** to move saved links into your dashboard (claim flow runs
   automatically on login/register).

### Registered Users

1. Sign up with name, email, and password.
2. If email is configured, verify via the link sent to your inbox (or use
   **Resend verification email** on login/register).
3. Use the dashboard to manage URLs, view analytics, and bulk-delete.
4. Create custom aliases (3–20 chars: letters, numbers, hyphens, underscores).

## Security

- Password hashing with bcrypt
- JWT in HTTP-only cookies with `tokenVersion` (invalidate sessions on password
  change)
- Email verification gate when Resend is configured
- Server-side validation (Joi)
- CORS, Helmet, CSRF checks on cookie-backed writes
- Rate limiting (per-endpoint tiers)
- Reserved slug protection
- Safe redirect validation (blocks private/local targets)
- Bot user agents excluded from click recording
- Graceful shutdown with connection cleanup

## Troubleshooting

| Issue                     | Solution                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| 401 / No token            | Check `FRONT_END_URL`; use `sameSite: 'none'` + `secure: true` in production cross-origin   |
| Verify email before login | Verify inbox/spam; use resend on login; or unset `RESEND_API_KEY` for local dev auto-verify |
| No verification email     | Check Resend dashboard, domain verification, and quota; set public `FRONT_END_URL` in prod  |
| 500 / DB errors           | Verify MongoDB URI and Atlas IP whitelist                                                   |
| CORS blocked              | Match `FRONT_END_URL` to frontend domain; use `ALLOWED_ORIGINS` if needed                   |
| Short link 404 on SPA     | Proxy `/:slug` to backend or set `VITE_PUBLIC_SHORT_URL` to the redirect host               |

See also [PRIVACY.md](./PRIVACY.md) for analytics retention and
[FRONTEND/README.md](./FRONTEND/README.md) for frontend-specific notes.
