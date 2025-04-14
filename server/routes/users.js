import express from "express";
import {
  getUser,
  getUsers,
  deleteUser,
  getCurrentUser,
  getCurrentUserSubscription,
  getCurrentUserBilling,
  updateCurrentUser,
} from "../controllers/user.js";

const router = express.Router();

router.get("/get", getUsers);
router.get("/find/:userId", getUser);
router.delete("/:id", deleteUser);

router.get("/current", getCurrentUser);
router.get("/current-subscription", getCurrentUserSubscription);
router.get("/current-billing", getCurrentUserBilling);
router.put("/update-current", updateCurrentUser);

export default router;
