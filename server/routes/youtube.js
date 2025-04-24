import express from "express";
import {
  youtubeSearch,
  getYoutubeTranscript,
  generateYoutubeTranscript,
  youtubeGPT,
  geminiQuery,
} from "../controllers/youtube.js";
import { rateLimiter } from "../connection/middlewares.js";

const router = express.Router();

router.post("/search", rateLimiter, youtubeSearch);
router.post("/get-transcript", rateLimiter, getYoutubeTranscript);
router.post("/generate-transcript", rateLimiter, generateYoutubeTranscript);
router.post("/gemini-query", rateLimiter, geminiQuery);


router.post("/gpt", rateLimiter, youtubeGPT);

export default router;
