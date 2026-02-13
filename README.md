# Shortly - URL Shortener Application

A simple URL shortener that converts long URLs into short, shareable links. Live
at [shortly.nayan04.me](https://shortly.nayan04.me/).

## Features

- **URL Shortening** - Convert long URLs to short links (no account required)
- **Custom Aliases** - Create personalized short URLs (3–20 chars, logged-in
  users)
- **Click Tracking** - Monitor URL usage statistics
- **URL Management** - View, search, sort, copy, and delete your links
- **Bulk Delete** - Select and delete multiple URLs at once
- **Analytics** - Dashboard with stats, recent activity, and top-performing URLs

## Architecture

### Frontend (React + Vite)

```
FRONTEND/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── LandingPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── UrlForm.jsx
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   ├── AccountSettings.jsx
│   │   ├── UserProfileModal.jsx
│   │   ├── Accessibility.jsx
│   │   ├── UxEnhancements.jsx
│   │   └── ErrorBoundary.jsx
│   ├── api/
│   │   ├── shortUrl.api.js
│   │   └── user.api.js
│   └── utils/
└── public/
```

### Backend (Node.js + Express)

```
BACKEND/
├── src/
│   ├── controllers/
│   ├── schema/
│   ├── dao/
│   ├── services/
│   ├── routes/
│   ├── middleware/
│   ├── validation/
│   ├── utils/
│   └── config/
└── index.js
```

## Quick Start

### Prerequisites

- Node.js v16+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/0x4Nayan04/Shortly.git
cd Shortly
```

### 2. Backend Setup

```bash
cd BACKEND
npm install
```

Create a `.env` file in `BACKEND/`:

```env
MONGODB_URI=mongodb://localhost:27017/url_shortener
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
FRONT_END_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

**Optional (production):**

```env
ALLOWED_ORIGINS=https://your-custom-domain.com
```

### 3. Frontend Setup

```bash
cd FRONTEND
npm install
```

Create a `.env` file in `FRONTEND/`:

```env
VITE_APP_URL=http://localhost:3001
```

### 4. Run the Application

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

Open `http://localhost:5173` to use Shortly.

## Environment Variables

### Backend (.env.example)

```env
MONGODB_URI=mongodb://localhost:27017/url_shortener
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
FRONT_END_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=
```

| Variable        | Required | Description                                              |
| --------------- | -------- | -------------------------------------------------------- |
| MONGODB_URI     | Yes      | MongoDB connection string                                |
| JWT_SECRET      | Yes      | Secret for JWT (min 32 chars)                            |
| FRONT_END_URL   | Yes      | Frontend origin for CORS and cookies                     |
| PORT            | Yes      | Server port                                              |
| NODE_ENV        | No       | `development` or `production`                            |
| ALLOWED_ORIGINS | No       | Comma-separated CORS origins (defaults to FRONT_END_URL) |

### Frontend (.env.example)

```env
VITE_APP_URL=http://localhost:3001
```

| Variable     | Required | Description          |
| ------------ | -------- | -------------------- |
| VITE_APP_URL | Yes      | Backend API base URL |

## Production Deployment

### Backend

1. Set environment variables (no backend URL in docs).
2. Build: `npm install`
3. Start: `npm start`

### Frontend

1. Set `VITE_APP_URL` to your backend API URL.
2. Build: `npm run build`
3. Output: `dist/`

### Deployment Notes

- **Auth (401)**: Set `NODE_ENV=production`, use `sameSite: 'none'` and
  `secure: true` for cross-origin cookies.
- **CORS**: Ensure `FRONT_END_URL` matches your frontend domain; use
  `ALLOWED_ORIGINS` for multiple origins.
- **MongoDB**: Include database name in the connection string; add deployment
  IPs to Atlas whitelist if needed.

## API Documentation

### Base URL

- Development: `http://localhost:3001`

### Authentication

| Method | Endpoint           | Auth | Description   |
| ------ | ------------------ | ---- | ------------- |
| POST   | /api/auth/register | No   | Register user |
| POST   | /api/auth/login    | No   | Login         |
| GET    | /api/auth/me       | Yes  | Get profile   |
| POST   | /api/auth/logout   | Yes  | Logout        |

### URL Shortening

| Method | Endpoint            | Auth | Description                              |
| ------ | ------------------- | ---- | ---------------------------------------- |
| POST   | /api/create         | No   | Create short URL                         |
| POST   | /api/create/custom  | Yes  | Create custom short URL                  |
| GET    | /api/create/my-urls | Yes  | Get user URLs (search, sort, pagination) |
| GET    | /api/create/stats   | Yes  | Get URL statistics                       |
| DELETE | /api/create/:id     | Yes  | Delete single URL                        |
| DELETE | /api/create/bulk    | Yes  | Bulk delete URLs                         |
| GET    | /:short_url         | No   | Redirect to original URL                 |

### Example: Create Short URL

```http
POST /api/create
Content-Type: application/json

{
  "full_url": "https://www.example.com/very/long/url/path"
}
```

### Example: Create Custom Short URL

```http
POST /api/create/custom
Content-Type: application/json
Cookie: token=<jwt>

{
  "full_url": "https://www.example.com/page",
  "custom_url": "my-link"
}
```

### Example: Get User URLs (with query params)

```http
GET /api/create/my-urls?limit=20&skip=0&search=example&sortBy=createdAt&sortOrder=desc
Cookie: token=<jwt>
```

## Tech Stack

### Frontend

- React 19, Vite 6, TailwindCSS 4
- React Router, Axios, React Query
- react-hot-toast

### Backend

- Node.js, Express 5, MongoDB, Mongoose 8
- JWT, bcrypt, nanoid, Joi, CORS
- Helmet, compression, cookie-parser

### Development

- ESLint, Nodemon, dotenv

## Usage

### Anonymous Users

1. Visit the homepage
2. Enter a long URL to shorten
3. Copy and share the short URL

### Registered Users

1. Sign up with name, email, and password
2. Use the dashboard to manage URLs
3. Create custom short URLs (3–20 chars, alphanumeric, hyphens, underscores)
4. View stats, search, sort, and bulk delete

## Security

- Password hashing with bcrypt
- JWT in HTTP-only cookies
- Server-side validation (Joi)
- CORS and Helmet
- Secure cookie options for production

## Troubleshooting

| Issue           | Solution                                                                          |
| --------------- | --------------------------------------------------------------------------------- |
| 401 / No token  | Check `FRONT_END_URL`; ensure `sameSite: 'none'` and `secure: true` in production |
| 500 / DB errors | Verify MongoDB URI and Atlas IP whitelist                                         |
| CORS blocked    | Match `FRONT_END_URL` to frontend domain; use `ALLOWED_ORIGINS` if needed         |
