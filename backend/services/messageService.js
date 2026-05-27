// Direct messaging: one conversation doc per user pair (deterministic id),
// with a messages subcollection.
const admin = require('firebase-admin');
const db = require('../firebaseAdmin');
const { getById } = require('./userService');
const HttpError = require('../utils/httpError');

const CONVERSATIONS = 'conversations';
const MESSAGES = 'messages';

// Deterministic id so either participant resolves the same conversation.
function conversationId(a, b) {
  return [a, b].sort().join('__');
}

function displayNameOf(snap) {
  const d = snap.data();
  return d.profile?.displayName || d.spotifyProfile?.displayName || snap.id;
}

function shapeConversation(doc, meId) {
  const d = doc.data();
  const otherId = (d.participants || []).find((p) => p !== meId) || null;
  return {
    id: doc.id,
    otherUserId: otherId,
    otherUserName: otherId ? d.participantNames?.[otherId] || otherId : null,
    lastMessage: d.lastMessage || '',
    lastMessageAt: d.lastMessageAt?.toMillis?.() || null,
    lastSenderId: d.lastSenderId || null,
  };
}

function shapeMessage(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    senderId: d.senderId,
    text: d.text,
    createdAt: d.createdAt?.toMillis?.() || null,
  };
}

// All conversations involving `meId`, newest activity first.
// Sorted in JS (not via orderBy) so no composite index is needed for the
// array-contains + ordering combination.
async function listConversations(meId) {
  const snap = await db
    .collection(CONVERSATIONS)
    .where('participants', 'array-contains', meId)
    .get();
  return snap.docs
    .map((doc) => shapeConversation(doc, meId))
    .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
}

// Fetch (without creating) the conversation + messages between me and otherId.
async function getConversation(meId, otherId) {
  const convId = conversationId(meId, otherId);
  const convSnap = await db.collection(CONVERSATIONS).doc(convId).get();
  const msgsSnap = await db
    .collection(CONVERSATIONS)
    .doc(convId)
    .collection(MESSAGES)
    .orderBy('createdAt', 'asc')
    .limit(200)
    .get();
  return {
    conversation: convSnap.exists ? shapeConversation(convSnap, meId) : null,
    messages: msgsSnap.docs.map(shapeMessage),
  };
}

// Send a message, lazily creating/updating the conversation doc.
async function sendMessage(meId, otherId, text) {
  if (meId === otherId) {
    throw new HttpError(400, 'Cannot message yourself', 'self_message');
  }
  const [meSnap, otherSnap] = await Promise.all([getById(meId), getById(otherId)]);
  if (!otherSnap) throw new HttpError(404, 'Recipient not found', 'user_not_found');

  const convId = conversationId(meId, otherId);
  const convRef = db.collection(CONVERSATIONS).doc(convId);
  const now = admin.firestore.FieldValue.serverTimestamp();

  const participantNames = {
    [meId]: displayNameOf(meSnap),
    [otherId]: displayNameOf(otherSnap),
  };

  await convRef.set(
    {
      participants: [meId, otherId].sort(),
      participantNames,
      lastMessage: text,
      lastMessageAt: now,
      lastSenderId: meId,
      createdAt: now,
    },
    { merge: true }
  );

  const msgRef = await convRef.collection(MESSAGES).add({
    senderId: meId,
    text,
    createdAt: now,
  });
  const msgSnap = await msgRef.get();
  return shapeMessage(msgSnap);
}

module.exports = {
  conversationId,
  listConversations,
  getConversation,
  sendMessage,
};
