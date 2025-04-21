import express from "express";
import { youtubeSearch, getYoutubeTranscript, generateYoutubeTranscript, youtubeGPT} from "../controllers/youtube.js";
import { rateLimiter } from "../connection/middlewares.js";

const router = express.Router();

router.post("/search", rateLimiter, youtubeSearch);
router.post("/get-transcript", rateLimiter, getYoutubeTranscript)
router.post("/generate-transcript", rateLimiter, generateYoutubeTranscript)
router.post("/gpt", rateLimiter, youtubeGPT)

export default router;
