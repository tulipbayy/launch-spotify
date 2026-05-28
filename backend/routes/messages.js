const express = require("express");
const admin = require("firebase-admin");
const db = require("../firebaseAdmin");

const router = express.Router();

router.get("/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    const snapshot = await db
      .collection("messages")
      .orderBy("timestamp", "asc")
      .get();

    const messages = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter(
        (message) =>
          (message.senderID === user1 && message.recipientID === user2) ||
          (message.senderID === user2 && message.recipientID === user1)
      )
      .map((message) => ({
        ...message,
        timestamp: message.timestamp?.toDate
          ? message.timestamp.toDate().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })
          : "Now",
      }));

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/", async (req, res) => {
  const { senderID, recipientID, text } = req.body;

  if (!senderID || !recipientID || !text) {
    return res.status(400).json({
      error: "senderID, recipientID, and text are required",
    });
  }

  try {
    const messageData = {
      senderID,
      recipientID,
      text,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("messages").add(messageData);

    res.status(201).json({
      id: docRef.id,
      senderID,
      recipientID,
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;