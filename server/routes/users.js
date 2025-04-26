import express from "express";
import {
  // getUser,
  // getUsers,
  // deleteUser,
  getCurrentUser,
  getCurrentUserSubscription,
  getCurrentUserBilling,
  updateCurrentUser,
  writeNote,
  getNotes,
  deleteNote,
  writeFlashCards,
  getFlashCards,
  deleteFlashCards,
  getRecentVideos,
  updateRecentVideo
} from "../controllers/user.js";

const router = express.Router();

// router.get("/get", getUsers);
// router.get("/find/:userId", getUser);
// router.delete("/:id", deleteUser);

router.get("/current", getCurrentUser);
router.get("/current-subscription", getCurrentUserSubscription);
router.get("/current-billing", getCurrentUserBilling);
router.put("/update-current", updateCurrentUser);
router.post("/write-note", writeNote);
router.post("/get-notes", getNotes);
router.post("/delete-note", deleteNote);
router.post("/write-flashcards", writeFlashCards);
router.post("/get-flashcards", getFlashCards);
router.post("/delete-flashcards", deleteFlashCards);
router.post("/get-recent-videos", getRecentVideos)
router.post("/update-recent-videos", updateRecentVideo)

export default router;
