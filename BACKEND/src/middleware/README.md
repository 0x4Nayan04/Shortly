# Authentication Middleware Documentation

## Overview

The authentication middleware provides secure JWT-based authentication for your URL shortener application.

## Middleware Functions

### 1. `isAuthenticated`

**Purpose**: Protects routes that require user authentication
**Usage**: Place before route handlers that need authentication
**Behavior**:

- Checks for JWT token in Authorization header (`Bearer <token>`) or cookies
- Verifies token and adds user to `req.user`
- Returns 401 error if token is missing or invalid

### 2. `optionalAuth`

**Purpose**: Adds user information if available, but doesn't require authentication
**Usage**: For routes that work differently for authenticated vs anonymous users
**Behavior**:

- Checks for JWT token but doesn't throw errors if missing
- Sets `req.user = null` if no valid token found
- Sets `req.user` to user object if valid token found

### 3. `isOwner`

**Purpose**: Ensures user can only access their own resources
**Usage**: Use after `isAuthenticated` to check resource ownership
**Behavior**:

- Compares authenticated user ID with resource owner ID
- Returns 403 error if user doesn't own the resource

## Examples

### Protected Route Example

```javascript
import { isAuthenticated } from "../middleware/auth.middleware.js";

// Only authenticated users can access this route
router.get("/profile", isAuthenticated, getUserProfile);
```

### Optional Authentication Example

```javascript
import { optionalAuth } from "../middleware/auth.middleware.js";

// Works for both authenticated and anonymous users
router.post("/create", optionalAuth, createShortUrl);
```

### Resource Ownership Example

```javascript
import { isAuthenticated, isOwner } from "../middleware/auth.middleware.js";

// Only the owner can delete their URL
router.delete("/url/:id", isAuthenticated, isOwner("id"), deleteShortUrl);
```

## Token Format

The middleware expects JWT tokens in one of these formats:

1. **Authorization Header**: `Authorization: Bearer <jwt_token>`
2. **Cookie**: `token=<jwt_token>`

## Error Responses

```javascript
// Missing token
{ "success": false, "message": "Access denied. No token provided." }

// Invalid token
{ "success": false, "message": "Invalid token. Please login again." }

// Expired token
{ "success": false, "message": "Token has expired. Please login again." }

// User not found
{ "success": false, "message": "User not found. Token may be invalid." }

// Not resource owner
{ "success": false, "message": "Access denied. You can only access your own resources." }
```

## Routes that use authentication:

### Public Routes (no authentication required):

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /:short_url` - Redirect to original URL

### Optional Authentication Routes:

- `POST /api/create` - Create short URL (associates with user if authenticated)

### Protected Routes (authentication required):

- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/me` - Get user profile (alternative endpoint)
- `POST /api/auth/logout` - Logout user
- `GET /api/create/my-urls` - Get user's created URLs

## Frontend Integration

When making requests from the frontend, include the JWT token:

```javascript
// Using Authorization header
const response = await axios.post("/api/create/my-urls", data, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Or using cookies (automatic if httpOnly cookies are used)
const response = await axios.post("/api/create/my-urls", data, {
  withCredentials: true,
});
```
