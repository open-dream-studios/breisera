import express from "express";
import { youtubeSearch, getYoutubeTranscript, generateYoutubeTranscript} from "../controllers/youtube.js";
import { rateLimiter } from "../connection/middlewares.js";

const router = express.Router();

router.post("/search", rateLimiter, youtubeSearch);
router.post("/transcript", rateLimiter, getYoutubeTranscript)
router.post("/generate-transcript", rateLimiter, generateYoutubeTranscript)

export default router;
