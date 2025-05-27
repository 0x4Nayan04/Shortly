import dotenv from "dotenv";
import express, { urlencoded } from "express";
import connectDB from "./src/config/monogo.config.js";
import { redirectFromShortUrl } from "./src/controllers/shortUrl.controllers.js";
import shortUrlCreate from "./src/routes/shortUrl.routes.js";
import { errorHandler } from "../BACKEND/src/utlis/errorHandler.js";

dotenv.config("./.env");

const app = express();
app.use(express.json());
app.use(urlencoded()); // for url encode (payload)
app.use(errorHandler); // Error handler middleware

/* Create */
app.use("/api/create", shortUrlCreate);

/* Redirect */
app.get("/:short_url", redirectFromShortUrl);

app.listen(3000, () => {
  connectDB();
  console.log(`Server is running on 3000`);
});
