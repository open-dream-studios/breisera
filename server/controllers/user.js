import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { formatDateForMySQL } from "../functions/data.js";
import { db } from "../connection/connect.js";
import { products } from "../payments/stripe.js";

export const getUser = (req, res) => {
  const userId = req.params.userId;
  const q = "SELECT * FROM users WHERE user_id = ?";

  db.query(q, [userId], (err, data) => {
    if (err) return res.status(500).json(err);

    if (data.length > 0) {
      const { password, ...info } = data[0];
      return res.json(info);
    }
  });
};

export const getUsers = (req, res) => {
  const q = "SELECT * FROM users";

  db.query(q, [], (err, data) => {
    if (err) return res.status(500).json(err);
    const data2 = [];
    for (let i = 0; i < data.length; i++) {
      const { password, ...info } = data[i];
      data2.push(info);
    }
    return res.json(data2);
  });
};

export const deleteUser = (req, res) => {
  const token = req.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  jwt.verify(token, "jwtSecretKey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is invalid!");

    const q = "DELETE FROM users WHERE `user_id`= ?";

    db.query(q, [userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.affectedRows > 0)
        return res.status(200).json("User has been deleted.");
      return res.status(403).json("No accounts were deleted");
    });
  });
};

export const getCurrentUser = (req, res) => {
  const token = req.accessToken;
  if (!token) return res.json(null);

  jwt.verify(token, "jwtSecretKey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is invalid!");

    const q = "SELECT * FROM users WHERE user_id = ?";

    db.query(q, [userInfo.id], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.length === 0) return res.status(404).json("User not found");
      const {
        password,
        password_reset,
        password_reset_timestamp,
        stripe_customer_id,
        ...user
      } = data[0];
      return res.json(user);
    });
  });
};

export const getCurrentUserSubscription = (req, res) => {
  const token = req.accessToken;
  if (!token) return res.json(null);

  jwt.verify(token, "jwtSecretKey", async (err, userInfo) => {
    if (err) return res.status(403).json(null);

    try {
      const currentUser = await new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM users WHERE user_id = ?",
          [userInfo.id],
          (err, data) => {
            if (err) {
              console.error(
                "DB Query Error: Could not fetch current user",
                err
              );
              return reject(err);
            }
            resolve(data.length > 0 ? data[0] : null);
          }
        );
      });
      if (currentUser && currentUser.stripe_customer_id) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const subscriptionList = await stripe.subscriptions.list({
          customer: currentUser.stripe_customer_id,
          limit: 1,
          expand: ["data.items.data.price"],
        });
        if (!subscriptionList.data.length) {
          return res.status(200).json(null);
        }
        const subscription = subscriptionList.data[0];
        if (
          !subscription ||
          !subscription.items ||
          !subscription.items.data.length ||
          !subscription.items.data[0].price ||
          !subscription.items.data[0].price.id
        ) {
          return res.status(200).json(null);
        }
        const subscription_item = Object.keys(products).find(
          (key) =>
            products[key].price_id === subscription.items.data[0].price.id
        );
        return res.status(200).json({
          current_period_start: formatDateForMySQL(
            subscription.current_period_start
          ),
          current_period_end: formatDateForMySQL(
            subscription.current_period_end
          ),
          status: subscription.status,
          subscription_item: subscription_item,
        });
      }
      return res.status(200).json(null);
    } catch (error) {
      return res.status(500).json(null);
    }
  });
};

export const getCurrentUserBilling = (req, res) => {
  const token = req.accessToken;
  if (!token) return res.json(null);

  jwt.verify(token, "jwtSecretKey", async (err, userInfo) => {
    if (err) return res.status(403).json(null);

    try {
      const transactions = await new Promise((resolve, reject) => {
        db.query(
           "SELECT `payment_mode`, `stripe_latest_payment_status`, `stripe_amount`, `stripe_created_at` FROM transactions WHERE user_id = ?",
          [userInfo.id],
          (err, data) => {
            if (err) {
              console.error(
                "DB Query Error: Could not fetch transactions",
                err
              );
              return reject(err);
            }
            resolve(data);
          }
        );
      });

      const subscription_transactions = await new Promise((resolve, reject) => {
        db.query(
          "SELECT `payment_mode`, `stripe_latest_payment_status`, `stripe_amount`, `stripe_created_at` FROM subscription_transactions WHERE user_id = ?",
          [userInfo.id],
          (err, data) => {
            if (err) {
              console.error(
                "DB Query Error: Could not fetch subscription transactions",
                err
              );
              return reject(err);
            }
            resolve(data);
          }
        );
      });

      const sorted_transactions = [
        ...transactions,
        ...subscription_transactions,
      ];
      sorted_transactions.sort(
        (a, b) => new Date(formatDateForMySQL(b.stripe_created_at)) - new Date(formatDateForMySQL(a.stripe_created_at))
      )
      return res.status(200).json(sorted_transactions);
    } catch (error) {
      return res.status(500).json(null);
    }
  });
};

export const updateCurrentUser = (req, res) => {
  const token = req.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(token, "jwtSecretKey", (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json("No updates provided");
    }
    const updates = Object.entries(req.body)
      .map(([key, _]) => `\`${key}\` = ?`)
      .join(", ");

    const values = [...Object.values(req.body), userInfo.id];

    const q = `UPDATE users SET ${updates} WHERE user_id = ?`;

    db.query(q, values, (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.affectedRows > 0) {
        return res.json({
          message: "User updated successfully",
          updates: req.body,
        });
      }
      return res.status(400).json("No changes made.");
    });
  });
};
