import express from "express";
import { youtubeSearch } from "../controllers/youtube.js";
import { rateLimiter } from "../connection/middlewares.js";

const router = express.Router();

router.post("/search", rateLimiter, youtubeSearch);

export default router;
