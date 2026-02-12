import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { urlencoded } from "express";
import helmet from "helmet";
import compression from "compression";
import { errorHandler } from "../BACKEND/src/utils/errorHandler.js";
import connectDB from "./src/config/monogo.config.js";
import { redirectFromShortUrl } from "./src/controllers/shortUrl.controllers.js";
import authRoutes from "./src/routes/auth.routes.js";
import shortUrlCreate from "./src/routes/shortUrl.routes.js";
import { attachUser } from "./src/utils/attachUser.js";
import { validateEnvironment, validateEnvFormats } from "./src/utils/validateEnv.js";

// Load environment variables
dotenv.config("./.env");

// Validate required environment variables
validateEnvironment();
validateEnvFormats();

const app = express();

// Security Headers - Apply first
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false // Allow embedding for development
}));

// Enable compression for better performance
app.use(compression());

// Enhanced CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from environment
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
      : [process.env.FRONT_END_URL];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origin ${origin} not allowed. Allowed origins:`, allowedOrigins);
      callback(new Error(`CORS: Origin ${origin} not allowed by policy`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cookie",
    "Cache-Control"
  ],
  exposedHeaders: ["X-Total-Count", "X-Rate-Limit-Remaining"],
  maxAge: 86400 // Cache preflight response for 24 hours
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(urlencoded({ extended: true })); // for url encode (payload)
app.use(cookieParser()); // for parsing cookies
app.use(attachUser);

/* Create */
app.use("/api/create", shortUrlCreate);

/* Redirect */
app.get("/:short_url", redirectFromShortUrl);

/* auth */
app.use("/api/auth", authRoutes);

app.use(errorHandler); // Error handler middleware should be last

const PORT = process.env.PORT;

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});
