import express from "express";
import { createShortUrl } from "../controllers/shortUrl.controllers.js";

const router = express.Router();

router.post("/", createShortUrl);

export default router;
