# Shortly - URL Shortener Application

## ✨ Features

- URL Shortening - Convert long URLs to short links
- Custom Aliases - Create personalized short URLs (logged-in users)
- Click Tracking - Monitor URL usage statistics
- URL Management - View, copy, and delete your links

## 🏗️ Architecture

### Frontend (React + Vite)

```
FRONTEND/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx      # Navigation with user dropdown
│   │   ├── LandingPage.jsx # Hero section and URL form
│   │   ├── Dashboard.jsx   # User dashboard with analytics
│   │   ├── UrlForm.jsx     # URL shortening form
│   │   ├── LoginForm.jsx   # Authentication forms
│   │   └── ...
│   ├── api/                # API communication layer
│   │   ├── shortUrl.api.js # URL shortening endpoints
│   │   └── user.api.js     # User authentication endpoints
│   ├── utils/              # Utility functions
│   └── pages/              # Page components
└── public/                 # Static assets
```

### Backend (Node.js + Express)

```
BACKEND/
├── src/
│   ├── controllers/        # Request handlers
│   │   ├── auth.controller.js      # Authentication logic
│   │   └── shortUrl.controllers.js # URL shortening logic
│   ├── models/             # Database schemas
│   │   ├── user.model.js   # User data structure
│   │   └── shortUrl.model.js # URL data structure
│   ├── routes/             # API route definitions
│   ├── middleware/         # Authentication & validation
│   ├── services/           # Business logic layer
│   └── config/             # Database and app configuration
└── index.js               # Server entry point
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn** package manager

### 1. Clone the Repository

```bash
git clone https://github.com/0x4Nayan04/Shortly.git
cd Shortly
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd BACKEND
npm install
```

#### Environment Configuration

Create a `.env` file in the `BACKEND` directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/url_shortener
# or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/url_shortener

# JWT Secret (generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

#### Start the Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend server will start on `http://localhost:3001`

### 3. Frontend Setup

#### Install Dependencies

```bash
cd FRONTEND
npm install
```

#### Environment Configuration (Optional)

Create a `.env` file in the `FRONTEND` directory if you need custom API URLs:

```env
VITE_API_BASE_URL=http://localhost:3001
```

#### Start the Frontend Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173` to start using Shortly!

## 📡 API Documentation

### Base URL

```
http://localhost:3001
```

### Authentication Endpoints

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Login User

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Get User Profile

```http
GET /auth/profile
Authorization: Bearer <jwt_token>
```

#### Logout User

```http
POST /auth/logout
Authorization: Bearer <jwt_token>
```

### URL Shortening Endpoints

#### Create Short URL (Public)

```http
POST /api/short-url
Content-Type: application/json

{
  "full_url": "https://www.example.com/very/long/url/path"
}
```

#### Create Custom Short URL (Authenticated)

```http
POST /api/short-url/custom
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "full_url": "https://www.example.com/very/long/url/path",
  "custom_alias": "my-custom-link"
}
```

#### Get User's URLs

```http
GET /api/short-url/my-urls
Authorization: Bearer <jwt_token>
```

#### Delete URL

```http
DELETE /api/short-url/:id
Authorization: Bearer <jwt_token>
```

#### Redirect to Original URL

```http
GET /:short_code
```

## 🛠️ Tech Stack

### Frontend

- **React 19.1.0** - Modern UI library with hooks
- **Vite 6.3.5** - Fast build tool and dev server
- **TailwindCSS 4.1.7** - Utility-first CSS framework
- **React Router Dom** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Query** - Server state management

### Backend

- **Node.js** - JavaScript runtime
- **Express 5.1.0** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose 8.15.0** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **nanoid** - Unique ID generator for short URLs
- **CORS** - Cross-origin resource sharing

### Development Tools

- **ESLint** - Code linting and formatting
- **Nodemon** - Auto-restart development server
- **dotenv** - Environment variable management

## 🚦 Usage

### For Anonymous Users

1. **Visit the Homepage** - Access the URL shortener without registration
2. **Shorten URLs** - Enter any long URL to get a shortened version
3. **Copy & Share** - Use the generated short URL anywhere

### For Registered Users

1. **Create an Account** - Sign up with name, email, and password
2. **Dashboard Access** - View all your shortened URLs and statistics
3. **Custom Aliases** - Create memorable custom short URLs
4. **Track Analytics** - Monitor click counts and usage patterns
5. **Manage URLs** - Edit, delete, or copy your shortened URLs

### URL Management

- **Create Standard Short URLs** - Automatic generation with nanoid
- **Create Custom Short URLs** - Choose your own alias (3-20 characters)
- **View Click Statistics** - Track how many times each URL was accessed
- **Copy to Clipboard** - One-click copying of short URLs
- **Delete URLs** - Remove URLs you no longer need

## 🔒 Security Features

- **Password Hashing** - bcrypt with salt rounds for secure password storage
- **JWT Authentication** - Secure token-based authentication
- **Input Validation** - Server-side validation for all user inputs
- **CORS Protection** - Configured cross-origin resource sharing
- **SQL Injection Prevention** - MongoDB and Mongoose protection

We welcome contributions! Please follow these steps:

1. **Fork the Repository**

   ```bash
   git fork https://github.com/0x4Nayan04/Shortly.git
   ```

2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Commit Your Changes**

   ```bash
   git commit -m 'Add amazing feature'
   ```

4. **Push to the Branch**

   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Version 2.0 (Planned Features)

- [ ] **QR Code Generation** - Generate QR codes for short URLs
- [ ] **Analytics Dashboard** - Detailed click analytics with charts
- [ ] **Bulk URL Import** - Upload CSV files with multiple URLs
- [ ] **API Rate Limiting** - Prevent abuse with rate limiting
- [ ] **Custom Domains** - Support for custom branded domains
- [ ] **Link Expiration** - Set expiration dates for URLs
- [ ] **Link Preview** - Social media link previews
- [ ] **Team Management** - Share URLs within teams
- [ ] **Advanced Analytics** - Geographic and device analytics
- [ ] **Mobile App** - React Native mobile application

### Version 3.0 (Future Vision)

- [ ] **AI-Powered Suggestions** - Smart alias recommendations
- [ ] **Integration APIs** - Slack, Discord, and other platform integrations
- [ ] **White-label Solution** - Customizable branding options
- [ ] **Enterprise Features** - SSO, advanced security, compliance

---

<div align="center">
  <p>Made with ❤️ by the Shortly Team</p>
  <p>
    <a href="#top">Back to Top</a> •
    <a href="https://github.com/0x4Nayan04/Shortly/issues">Report Bug</a> •
    <a href="https://github.com/0x4Nayan04/Shortly/issues">Request Feature</a>
  </p>
</div>
