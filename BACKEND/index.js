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
  const allowedOrigins = ["http://localhost:5173"];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
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

app.listen(3000, () => {
  connectDB();
  console.log(`Server is running on 3000`);
});
