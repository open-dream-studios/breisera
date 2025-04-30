import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { formatDateForMySQL, generateId } from "../functions/data.js";
import { db } from "../connection/connect.js";
import { products } from "../payments/stripe.js";
import { decodeToken } from "../functions/auth.js";
import dotenv from "dotenv";
dotenv.config();

// export const getUser = (req, res) => {
//   const userId = req.params.userId;
//   const q = "SELECT * FROM users WHERE user_id = ?";

//   db.query(q, [userId], (err, data) => {
//     if (err) return res.status(500).json(err);

//     if (data.length > 0) {
//       const { password, ...info } = data[0];
//       return res.json(info);
//     }
//   });
// };

// export const getUsers = (req, res) => {
//   const q = "SELECT * FROM users";

//   db.query(q, [], (err, data) => {
//     if (err) return res.status(500).json(err);
//     const data2 = [];
//     for (let i = 0; i < data.length; i++) {
//       const { password, ...info } = data[i];
//       data2.push(info);
//     }
//     return res.json(data2);
//   });
// };
//
// export const deleteUser = (req, res) => {
//   const token = req.cookies.accessToken
//   if (!token) return res.status(401).json("Not logged in!");

//   jwt.verify(token, process.env.JWT_SECRET, (err, userInfo) => {
//     if (err) return res.status(403).json("Token is invalid!");

//     const q = "DELETE FROM users WHERE `user_id`= ?";

//     db.query(q, [userInfo.id], (err, data) => {
//       if (err) return res.status(500).json(err);
//       if (data.affectedRows > 0)
//         return res.status(200).json("User has been deleted.");
//       return res.status(403).json("No accounts were deleted");
//     });
//   });
// };

export const getCurrentUser = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.json(null);

  jwt.verify(token, process.env.JWT_SECRET, (err, userInfo) => {
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
  const token = req.cookies.accessToken;
  if (!token) return res.json(null);

  jwt.verify(token, process.env.JWT_SECRET, async (err, userInfo) => {
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
  const token = req.cookies.accessToken;
  if (!token) return res.json(null);

  jwt.verify(token, process.env.JWT_SECRET, async (err, userInfo) => {
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
        (a, b) =>
          new Date(formatDateForMySQL(b.stripe_created_at)) -
          new Date(formatDateForMySQL(a.stripe_created_at))
      );
      return res.status(200).json(sorted_transactions);
    } catch (error) {
      return res.status(500).json(null);
    }
  });
};

export const updateCurrentUser = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(token, process.env.JWT_SECRET, (err, userInfo) => {
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

export const writeNote = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");
  let {
    user_id,
    note_id,
    collection_id,
    video_id,
    video_data,
    title,
    content,
  } = req.body;
  collection_id = collection_id ? collection_id : generateId(15);

  try {
    // Make sure the user doesn't have more than 100 notes already
    const userNotes = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM notes WHERE user_id = ?",
        [user_id],
        (err, data) => {
          if (err) {
            console.error("DB Query Error: Could not fetch existing note", err);
            return reject(err);
          }
          resolve(data.length);
        }
      );
    });

    // Search to see if the note already exists
    const existingNote = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM notes WHERE user_id = ? AND note_id = ?",
        [user_id, note_id],
        (err, data) => {
          if (err) {
            console.error("DB Query Error: Could not fetch existing note", err);
            return reject(err);
          }
          resolve(data.length > 0 ? data[0].note_id : null);
        }
      );
    });
    let note = existingNote || null;

    if (!note) {
      // Create a new note
      if (userNotes && userNotes >= 100) {
        return res.status(417).json({ message: "User notes limit exceeded" });
      }
      const success = await new Promise((resolve, reject) => {
        db.query(
          "INSERT INTO notes (`note_id`,`user_id`,`collection_id`,`video_id`,`video_data`,`title`,`content`) VALUE (?)",
          [
            [
              note_id,
              user_id,
              collection_id,
              video_id,
              video_data,
              title,
              content,
            ],
          ],
          (err, data) => {
            if (err) {
              console.error(
                "DB Mutation Error: Could not create new note",
                err
              );
              return reject(err);
            }
            resolve(data);
          }
        );
      });
      if (success) {
        return res.status(200).json({ message: "Note created" });
      } else {
        return res.status(417).json({ message: "Note creation failed" });
      }
    } else {
      // Update new note
      const success = await new Promise((resolve, reject) => {
        db.query(
          "UPDATE notes SET title = ?, content = ?, collection_id = ? WHERE user_id = ? AND note_id = ?",
          [title, content, collection_id, user_id, note_id],
          (err, data) => {
            if (err) {
              console.error("DB Mutation Error: Could not update note", err);
              return reject(err);
            }
            resolve(data);
          }
        );
      });
      if (success) {
        return res.status(200).json({ message: "Note updated" });
      } else {
        return res.status(417).json({ message: "Note update failed" });
      }
    }
  } catch (error) {
    return res.status(404).json(null);
  }
};

export const getNotes = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");
  const user_id = decodeToken(token);

  try {
    const notes = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC",
        [user_id],
        (err, data) => {
          if (err) {
            console.error("DB Query Error: Could not fetch notes", err);
            return reject(err);
          }
          resolve(data);
        }
      );
    });

    return res.status(200).json({
      success: true,
      notes: notes.length > 0 ? notes : [],
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return res.status(500).json({ success: false, notes: [] });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const { user_id, note_id } = req.body;
    if (!note_id || !user_id) {
      return res.status(400).json({ error: "Note ID is required" });
    }
    const [result] = await db
      .promise()
      .query("DELETE FROM notes WHERE user_id = ? AND note_id = ?", [
        user_id,
        note_id,
      ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Note not found or not authorized to delete",
      });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const saveFlashCards = async (
  user_id,
  flashcard_id,
  collection_id,
  title,
  content,
  video_id,
  video_data
) => {
  try {
    // Search to see if the flashcards already exists
    const existingFlashCards = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM flashcards WHERE user_id = ? AND flashcard_id = ?",
        [user_id, flashcard_id],
        (err, data) => {
          if (err) {
            console.error(
              "DB Query Error: Could not fetch existing flashcards",
              err
            );
            return reject(err);
          }
          resolve(data.length > 0 ? data[0].flashcard_id : null);
        }
      );
    });
    let flashcards = existingFlashCards || null;
    if (!flashcards) {
      // Create a new flashcard set
      const success = await new Promise((resolve, reject) => {
        db.query(
          "INSERT INTO flashcards (`user_id`,`flashcard_id`,`collection_id`,`title`,`content`,`video_id`,`video_data`) VALUE (?)",
          [
            [
              user_id,
              flashcard_id,
              collection_id,
              title,
              content,
              video_id,
              video_data,
            ],
          ],
          (err, data) => {
            if (err) {
              console.error(
                "DB Mutation Error: Could not create new flashcard set",
                err
              );
              return reject(err);
            }
            resolve(data);
          }
        );
      });
      return success;
    } else {
      // Update flashcard set
      const success = await new Promise((resolve, reject) => {
        db.query(
          "UPDATE flashcards SET title = ?, content = ?, collection_id = ? WHERE user_id = ? AND flashcard_id = ?",
          [title, content, collection_id, user_id, flashcard_id],
          (err, data) => {
            if (err) {
              console.error(
                "DB Mutation Error: Could not update flashcards",
                err
              );
              return reject(err);
            }
            resolve(data);
          }
        );
      });
      return success;
    }
  } catch (error) {
    return null;
  }
};

export const writeFlashCards = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");
  const user_id = decodeToken(token);

  let { flashcard_id, title, content, collection_id, video_id, video_data } =
    req.body;
  collection_id = collection_id ? collection_id : generateId(15);

  try {
    const result = await saveFlashCards(
      user_id,
      flashcard_id,
      collection_id,
      title,
      content,
      video_id,
      video_data
    );
    if (result) {
      return res.status(200).json("Flashcards saved");
    } else {
      return res.status(500).json("Error saving flashcards");
    }
  } catch (error) {
    return res.status(404).json(null);
  }
};

export const getFlashCards = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");
  const user_id = decodeToken(token);

  try {
    const flashcards = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM flashcards WHERE user_id = ? ORDER BY updated_at DESC",
        [user_id],
        (err, data) => {
          if (err) {
            console.error("DB Query Error: Could not fetch flashcards", err);
            return reject(err);
          }
          resolve(data);
        }
      );
    });

    return res.status(200).json({
      success: true,
      flashcards: flashcards.length > 0 ? flashcards : [],
    });
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return res.status(500).json({ success: false, flashcards: [] });
  }
};

export const deleteFlashCards = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const { user_id, flashcard_id } = req.body;
    if (!flashcard_id || !user_id) {
      return res.status(400).json({ error: "Flashcard ID is required" });
    }
    const [result] = await db
      .promise()
      .query("DELETE FROM flashcards WHERE user_id = ? AND flashcard_id = ?", [
        user_id,
        flashcard_id,
      ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Flashcard set not found or not authorized to delete",
      });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting flashcards:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getRecentVideos = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const user_id = decodeToken(token);

    const recentVideos = await new Promise((resolve, reject) => {
      db.query(
        `
          SELECT video_data, last_timestamp 
          FROM recent_videos 
          WHERE user_id = ? 
          ORDER BY updated_at DESC 
          LIMIT 500
        `,
        [user_id],
        (err, data) => {
          if (err) {
            console.error("DB Query Error:", err);
            return reject(err);
          }
          resolve(data);
        }
      );
    });

    return res.status(200).json({
      success: true,
      recentVideos,
    });
  } catch (error) {
    console.error("Error fetching recent videos:", error);
    return res.status(500).json({ success: false, recentVideos: [] });
  }
};

export const updateRecentVideo = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const user_id = decodeToken(token);
    const { video_id, video_data, updateTime, last_timestamp } = req.body;

    if (!video_id || !video_data || last_timestamp === null) {
      return res.status(400).json({ error: "Missing video data" });
    }

    if (updateTime) {
      await new Promise((resolve, reject) => {
        db.query(
          `
          INSERT INTO recent_videos (user_id, video_id, video_data, last_timestamp)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            last_timestamp = VALUES(last_timestamp)
        `,
          [user_id, video_id, video_data, last_timestamp],
          (err, result) => {
            if (err) {
              console.error("DB Query Error:", err);
              return reject(err);
            }
            resolve(result);
          }
        );
      });
    } else {
      await new Promise((resolve, reject) => {
        db.query(
          `
          INSERT INTO recent_videos (user_id, video_id, video_data, last_timestamp)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            updated_at = CURRENT_TIMESTAMP
        `,
          [user_id, video_id, video_data, last_timestamp],
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
      });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating recent video:", error);
    return res.status(500).json({ success: false });
  }
};

export const getVideoCollections = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const user_id = decodeToken(token);

    const videos = await new Promise((resolve, reject) => {
      db.query(
        `
          SELECT collection_id, video_data 
          FROM video_collections
          WHERE user_id = ?
          ORDER BY updated_at DESC
          LIMIT 500
        `,
        [user_id],
        (err, data) => {
          if (err) {
            console.error("DB Query Error:", err);
            return reject(err);
          }
          resolve(data);
        }
      );
    });

    if (videos.length === 0) {
      return res.status(200).json({ success: true, collections: [] });
    }

    const collectionIds = [...new Set(videos.map((v) => v.collection_id))]; // Unique IDs
    const collectionNames = await new Promise((resolve, reject) => {
      db.query(
        `
          SELECT collection_id, collection_name
          FROM collections
          WHERE user_id = ? AND collection_id IN (?)
        `,
        [user_id, collectionIds],
        (err, data) => {
          if (err) {
            console.error("DB Query Error (collection names):", err);
            return reject(err);
          }
          const map = {};
          for (const row of data) {
            map[row.collection_id] = row.collection_name;
          }
          resolve(map);
        }
      );
    });

    const collectionsMap = {};
    for (const video of videos) {
      const { collection_id, video_data } = video;
      if (!collectionsMap[collection_id]) {
        collectionsMap[collection_id] = [];
      }
      collectionsMap[collection_id].push(video_data);
    }

    const groupedCollections = Object.entries(collectionsMap).map(
      ([collection_id, videos]) => ({
        collection_id,
        collection_name:
          collectionNames[collection_id] || "Untitled Collection",
        videos,
      })
    );

    return res.status(200).json({
      success: true,
      collections: groupedCollections,
    });
  } catch (error) {
    console.error("Error fetching video collections:", error);
    return res.status(500).json({ success: false, collections: [] });
  }
};

export const updateVideoCollections = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const user_id = decodeToken(token);
    let { video_id, video_data, collection_id, collection_name } = req.body;

    collection_id = collection_id ? collection_id : generateId(15);

    if (!video_id || !video_data || !collection_id || !collection_name) {
      return res.status(400).json({ error: "Missing video data" });
    }

    await new Promise((resolve, reject) => {
      db.query(
        `
      INSERT INTO collections (user_id, collection_id, collection_name)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE collection_name = VALUES(collection_name)
    `,
        [user_id, collection_id, collection_name],
        (err, result) => {
          if (err) {
            console.error("DB Query Error:", err);
            return reject(err);
          }
          resolve(result);
        }
      );
    });

    await new Promise((resolve, reject) => {
      db.query(
        `
          INSERT IGNORE INTO video_collections (user_id, collection_id, video_id, video_data)
          VALUES (?, ?, ?, ?)
        `,
        [user_id, collection_id, video_id, video_data],
        (err, result) => {
          if (err) {
            console.error("DB Query Error:", err);
            return reject(err);
          }
          resolve(result);
        }
      );
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating video collection:", error);
    return res.status(500).json({ success: false });
  }
};

export const deleteVideoCollections = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const user_id = decodeToken(token);
    const { video_id, collection_id } = req.body;
    if (!video_id || !collection_id) {
      return res.status(400).json({ error: "IDs are required" });
    }

    const [result] = await db
      .promise()
      .query(
        "DELETE FROM video_collections WHERE user_id = ? AND collection_id = ? AND video_id = ?",
        [user_id, collection_id, video_id]
      );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Row was not found",
      });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting row:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getVideoCollectionNames = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const user_id = decodeToken(token);

    const collections = await new Promise((resolve, reject) => {
      db.query(
        `
      SELECT collection_id, collection_name
      FROM collections
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
        [user_id],
        (err, data) => {
          if (err) {
            console.error("DB Query Error (collection names):", err);
            return reject(err);
          }
          const result = data.map((row) => ({
            collection_id: row.collection_id,
            collection_name: row.collection_name,
          }));
          resolve(result);
        }
      );
    });

    return res.status(200).json({
      success: true,
      collections: collections,
    });
  } catch (error) {
    console.error("Error fetching video collections:", error);
    return res.status(500).json({ success: false, collections: [] });
  }
};

export const updateVideoCollectionNames = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const user_id = decodeToken(token);

    let { collection_name, collection_id } = req.body;
    collection_id = collection_id ? collection_id : generateId(15);

    await new Promise((resolve, reject) => {
      db.query(
        `
      INSERT INTO collections (user_id, collection_id, collection_name)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE collection_name = VALUES(collection_name)
    `,
        [user_id, collection_id, collection_name],
        (err, result) => {
          if (err) {
            console.error("DB Query Error:", err);
            return reject(err);
          }
          resolve(result);
        }
      );
    });

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Error adding collection:", error);
    return res.status(500).json({ success: false });
  }
};

export const deleteVideoCollectionName = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });
    const user_id = decodeToken(token);
    const { collection_id } = req.body;
    if (!collection_id) {
      return res.status(400).json({ error: "Collection ID is required" });
    }

    const [result] = await db
      .promise()
      .query(
        "DELETE FROM video_collections WHERE user_id = ? AND collection_id = ?",
        [user_id, collection_id]
      );

    const [result2] = await db
      .promise()
      .query(
        "DELETE FROM collections WHERE user_id = ? AND collection_id = ?",
        [user_id, collection_id]
      );
    // if (result.affectedRows === 0) {
    //   return res.status(200).json({
    //     success: false,
    //     message: "Rows were not found",
    //   });
    // }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting row:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
