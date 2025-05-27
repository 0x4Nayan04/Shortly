import dotenv from "dotenv";
import express, { urlencoded } from "express";
import connectDB from "./src/config/monogo.config.js";
import { redirectFromShortUrl } from "./src/controllers/shortUrl.controllers.js";
import shortUrlCreate from "./src/routes/shortUrl.routes.js";
import { errorHandler } from "../BACKEND/src/utlis/errorHandler.js";

dotenv.config("./.env");

const app = express();

// Add CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(urlencoded({ extended: true })); // for url encode (payload)

/* Create */
app.use("/api/create", shortUrlCreate);

/* Redirect */
app.get("/:short_url", redirectFromShortUrl);

app.use(errorHandler); // Error handler middleware should be last

app.listen(3000, () => {
  connectDB();
  console.log(`Server is running on 3000`);
});
