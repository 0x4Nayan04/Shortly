import dotenv from "dotenv";
import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/monogo.config.js";
import { redirectFromShortUrl } from "./src/controllers/shortUrl.controllers.js";
import shortUrlCreate from "./src/routes/shortUrl.routes.js";
import { errorHandler } from "../BACKEND/src/utlis/errorHandler.js";
import authRoutes from "./src/routes/auth.routes.js";
import { attachUser } from "./src/utlis/attachUser.js";
dotenv.config("./.env");

const app = express();

// Add CORS middleware
app.use((req, res, next) => {
  // Allow all origins for development
  res.header("Access-Control-Allow-Origin", process.env.FRONT_END_URL);
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

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
