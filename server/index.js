import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";
import http from "http";
import https from "https";
import fs from "fs";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import paymentRoutes from "./routes/payment.js";
import {
  handle1XCheckoutTransaction,
  handleSubscriptionCheckoutTransaction,
  handleSubscriptionRenewal,
} from "./payments/transactions.js";
import { db } from "./connection/connect.js";
import { initializeWebSocket, getIO } from "./connection/websocket.js";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const PORT = process.env.PORT || 8080;

// const server = http.createServer(app);
const server = isProduction
  ? http.createServer(app)
  : https.createServer(
      {
        key: fs.readFileSync("./ssl/key.pem"),
        cert: fs.readFileSync("./ssl/cert.pem"),
      },
      app
    );
const io = initializeWebSocket(server);

// STRIPE Webhooks
// TEST COMMAND
// Terminal 1: ngrok http http://localhost:8080
// Terminal 2: stripe listen --forward-to localhost:8080/webhook
// Terminal 3: stripe trigger invoice.payment_succeeded
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    // Security validation --> Ensure call came from stripe
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      // console.log("Webhook verified:", event.type);
    } catch (err) {
      console.error(`Webhook Signature Invalid: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Bypass security validation
    // try {
    //   event = JSON.parse(req.body);
    // } catch (err) {
    //   console.error("Error parsing webhook body:", err.message);
    //   return res.status(400).send("Invalid JSON");
    // }

    // Immediately confirm hook was received to stripe before processing to avoid multiple calls
    res.json({ received: true });
    const session = event.data.object;

    // Handle 1X payment checkout
    if (
      event.type === "checkout.session.completed" &&
      session.mode === "payment"
    ) {
      if (!session.metadata || Object.keys(session.metadata) === 0) {
        console.error("Missing metadata in session:", session);
        return res.status(400).send("Missing metadata in session");
      }
      console.log("1X PAYMENT SUCCESS");
      await handle1XCheckoutTransaction(event, res);
    } else if (
      event.type === "payment_intent.payment_failed" &&
      session.metadata.payment_mode === "payment"
    ) {
      console.log("1X PAYMENT FAILURE");
      await handle1XCheckoutTransaction(event, res);
    }

    // Handle subscription payment checkout
    if (
      event.type === "checkout.session.completed" &&
      session.mode === "subscription"
    ) {
      if (session.invoice) {
        // SUB CHECKOUT SUCCESS
        console.log("SUB CHECKOUT SUCCESS");
        const invoice = await stripe.invoices.retrieve(session.invoice);
        await handleSubscriptionCheckoutTransaction(
          event,
          res,
          session.metadata,
          invoice
        );
      }
    } else if (event.type === "payment_intent.payment_failed") {
      // SUB CHECKOUT FAILURE
      if (session.invoice) {
        const invoice = await stripe.invoices.retrieve(session.invoice);
        if (invoice.billing_reason === "subscription_create") {
          const metadata = invoice.lines.data[0]?.metadata || {};
          if (Object.keys(metadata) === 0) {
            // console.log("SUB CHECKOUT FAILURE -> NO METADATA");
          } else {
            if (metadata.payment_mode === "subscription") {
              console.log("SUB CHECKOUT FAILURE");
              await handleSubscriptionCheckoutTransaction(
                event,
                res,
                metadata,
                invoice
              );
            }
          }
        }
      } else {
        // console.log("SUB CHECKOUT FAILURE -> NO METADATA");
      }
    } else if (event.type === "checkout.session.async_payment_failed") {
      // SUB CHECKOUT FAILURE ASYNC
      if (session.invoice) {
        const invoice = await stripe.invoices.retrieve(session.invoice);
        if (invoice.billing_reason === "subscription_create") {
          const metadata = invoice.lines.data[0]?.metadata || {};
          if (Object.keys(metadata) === 0) {
            // console.log("SUB CHECKOUT ASYNC FAILURE -> NO METADATA");
          } else {
            if (metadata.payment_mode === "subscription") {
              console.log("SUB CHECKOUT ASYNC FAILURE");
              await handleSubscriptionCheckoutTransaction(
                event,
                res,
                metadata,
                invoice
              );
            }
          }
        }
      } else {
        // console.log("SUB CHECKOUT ASYNC FAILURE -> NO METADATA");
      }
    } else if (event.type === "invoice.payment_succeeded") {
      const invoice = await stripe.invoices.retrieve(event.data.object.id);
      if (invoice.billing_reason === "subscription_cycle") {
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );
          console.log("SUB CYCLE SUCCESS");
          await handleSubscriptionRenewal(
            event,
            res,
            subscription.metadata,
            subscription,
            invoice
          );
        }
      }
      if (invoice.billing_reason === "subscription_update") {
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );
          console.log("SUB UPDATE SUCCESS");
          await handleSubscriptionRenewal(
            event,
            res,
            subscription.metadata,
            subscription,
            invoice
          );
        }
      }
    } else if (event.type === "invoice.payment_failed") {
      const invoice = await stripe.invoices.retrieve(event.data.object.id);
      if (invoice.billing_reason === "subscription_cycle") {
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );
          console.log("SUB CYCLE FAILURE");
          await handleSubscriptionRenewal(
            event,
            res,
            subscription.metadata,
            subscription,
            invoice
          );
        }
      } else if (invoice.billing_reason === "subscription_update") {
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );
          console.log("SUB UPDATE FAILURE");
          await handleSubscriptionRenewal(
            event,
            res,
            subscription.metadata,
            subscription,
            invoice
          );
        }
      }
    } else if (event.type === "customer.subscription.deleted") {
      console.log("SUB CANCELED");
      getIO().emit("update-user");
    }
  }
);

// App
app.use((req, res, next) => {
  if (req.headers.authorization) {
    req.accessToken = req.headers.authorization.split(" ")[1];
  }
  next();
});

app.use(express.json());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);

// Database
db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed: ", err);
    return;
  }
  console.log("Connected to MySQL Database");
  connection.release();
});

// Process signals for web socket
const shutdown = () => {
  console.log("Shutting down server...");
  io.sockets.sockets.forEach((socket) => {
    socket.disconnect(true);
  });
  io.close(() => {
    console.log("WebSocket server closed.");
  });
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen(PORT, () => {
  console.log("API is running on port " + PORT);
});

app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

app.get("/api/*", (req, res) => {
  res.status(404).json("Page does not exist!");
});
