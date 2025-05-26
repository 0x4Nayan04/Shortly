import dotenv from "dotenv";
import express, { urlencoded } from "express";
import connectDB from "./src/config/monogo.config.js";
import shortUrlCreate from "./src/routes/shortUrl.routes.js";
import short_urlModel from "./src/schema/shortUrl.model.js";

dotenv.config("./.env");

const app = express();
app.use(express.json());
app.use(urlencoded()); // for url encode (payload)

/* Create */
app.use("/api/create", shortUrlCreate);

/* Redirect */
app.get("/api/:short_url", async (req, res) => {
  const { short_url } = req.params;
  const url = await short_urlModel.findOne({ short_url: short_url });
  // we are doing eary return here
  if (!url) {
    return res.status(404).send("URL not found");
  }
  url.click += 1; // Increment click count
  await url.save(); // Save the updated click count
  res.redirect(url.full_url); // Redirect to the full URL
});

app.listen(3000, () => {
  connectDB();
  console.log(`Server is running on 3000`);
});
