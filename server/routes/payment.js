import express from "express";
import {
  checkoutSession,
  customerPortalSession,
  customerUpdateSubscription
} from "../controllers/payment.js";

const router = express.Router();

router.post("/checkout-session", checkoutSession);
router.post("/stripe-portal", customerPortalSession);
router.post("/stripe-update-sub", customerUpdateSubscription);

export default router;
