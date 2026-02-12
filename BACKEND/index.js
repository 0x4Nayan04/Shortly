import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { urlencoded } from "express";
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

// Configure CORS properly
const corsOptions = {
  origin: process.env.FRONT_END_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cookie",
  ],
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
