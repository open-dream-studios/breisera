import express from "express";
import {
  youtubeSearch,
  getYoutubeTranscript,
  generateYoutubeTranscript,
  youtubeGPT,
  getVideoById,
} from "../controllers/youtube.js";
import {
  geminiQuery,
  geminiSummariesQuery,
  geminiFlashcardsQuery,
} from "../controllers/gemini.js";
import { rateLimiter } from "../connection/middlewares.js";

const router = express.Router();

router.post("/get-video", rateLimiter, getVideoById);
router.post("/search", rateLimiter, youtubeSearch);
router.post("/get-transcript", rateLimiter, getYoutubeTranscript);
router.post("/generate-transcript", rateLimiter, generateYoutubeTranscript);
router.post("/gemini-query", rateLimiter, geminiQuery);
router.post("/gemini-summaries", rateLimiter, geminiSummariesQuery);
router.post("/gemini-flashcards", rateLimiter, geminiFlashcardsQuery);

router.post("/gpt", rateLimiter, youtubeGPT);

export default router;
