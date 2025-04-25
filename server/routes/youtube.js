import express from "express";
import {
  youtubeSearch,
  getYoutubeTranscript,
  generateYoutubeTranscript,
  youtubeGPT,
  getVideoById
} from "../controllers/youtube.js";
import {
  geminiQuery,
  geminiSummaryQuery,
  geminiKeyConceptsQuery,
  geminiFlashcardsQuery,
} from "../controllers/gemini.js";
import { rateLimiter } from "../connection/middlewares.js";

const router = express.Router();

router.post("/get-video", rateLimiter, getVideoById);
router.post("/search", rateLimiter, youtubeSearch);
router.post("/get-transcript", rateLimiter, getYoutubeTranscript);
router.post("/generate-transcript", rateLimiter, generateYoutubeTranscript);
router.post("/gemini-query", rateLimiter, geminiQuery);
router.post("/gemini-summary", rateLimiter, geminiSummaryQuery);
router.post("/gemini-key-concepts", rateLimiter, geminiKeyConceptsQuery);
router.post("/gemini-flashcards", rateLimiter, geminiFlashcardsQuery);


router.post("/gpt", rateLimiter, youtubeGPT);

export default router;
