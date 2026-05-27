// Firestore forums + posts (posts as a subcollection of each forum).
const admin = require('firebase-admin');
const db = require('../firebaseAdmin');
const HttpError = require('../utils/httpError');

const FORUMS = 'forums';
const POSTS = 'posts';

// High Unicode codepoint (U+F8FF) — upper bound for case-insensitive prefix searches.
const PREFIX_END_CHAR = '';

function shapeForum(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    name: d.name,
    description: d.description || '',
    createdBy: d.createdBy,
    createdByName: d.createdByName || '',
    postCount: d.postCount || 0,
    createdAt: d.createdAt?.toMillis?.() || null,
  };
}

function shapePost(doc, viewerId) {
  const d = doc.data();
  return {
    id: doc.id,
    forumId: d.forumId,
    authorId: d.authorId,
    authorName: d.authorName || '',
    body: d.body,
    likeCount: d.likeCount || 0,
    liked: Array.isArray(d.likedBy) ? d.likedBy.includes(viewerId) : false,
    createdAt: d.createdAt?.toMillis?.() || null,
  };
}

// List forums; if `search` given, prefix-match (case-insensitive) on nameLower.
async function listForums({ search = '', limit = 30 } = {}) {
  let q = db.collection(FORUMS);
  if (search) {
    const lower = search.toLowerCase();
    q = q
      .orderBy('nameLower')
      .startAt(lower)
      .endAt(lower + PREFIX_END_CHAR)
      .limit(limit);
  } else {
    q = q.orderBy('createdAt', 'desc').limit(limit);
  }
  const snap = await q.get();
  return snap.docs.map(shapeForum);
}

async function createForum({ name, description, createdBy, createdByName }) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const ref = await db.collection(FORUMS).add({
    name,
    nameLower: name.toLowerCase(),
    description: description || '',
    createdBy,
    createdByName,
    postCount: 0,
    createdAt: now,
  });
  const snap = await ref.get();
  return shapeForum(snap);
}

async function getForum(forumId) {
  const snap = await db.collection(FORUMS).doc(forumId).get();
  if (!snap.exists) throw new HttpError(404, 'Forum not found', 'forum_not_found');
  return shapeForum(snap);
}

async function listPosts(forumId, { limit = 30 } = {}, viewerId) {
  const snap = await db
    .collection(FORUMS)
    .doc(forumId)
    .collection(POSTS)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((doc) => shapePost(doc, viewerId));
}

async function createPost(forumId, { body, authorId, authorName }) {
  const forumRef = db.collection(FORUMS).doc(forumId);
  const forumSnap = await forumRef.get();
  if (!forumSnap.exists) throw new HttpError(404, 'Forum not found', 'forum_not_found');

  const now = admin.firestore.FieldValue.serverTimestamp();
  const postRef = await forumRef.collection(POSTS).add({
    forumId,
    authorId,
    authorName,
    body,
    likeCount: 0,
    likedBy: [],
    createdAt: now,
  });
  await forumRef.update({ postCount: admin.firestore.FieldValue.increment(1) });
  const snap = await postRef.get();
  return shapePost(snap, authorId);
}

// Toggle a like in a transaction; returns the new count + whether viewer likes it.
async function toggleLike(forumId, postId, userId) {
  const postRef = db
    .collection(FORUMS)
    .doc(forumId)
    .collection(POSTS)
    .doc(postId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(postRef);
    if (!snap.exists) throw new HttpError(404, 'Post not found', 'post_not_found');
    const data = snap.data();
    const likedBy = data.likedBy || [];
    const liked = likedBy.includes(userId);
    tx.update(postRef, {
      likedBy: liked
        ? admin.firestore.FieldValue.arrayRemove(userId)
        : admin.firestore.FieldValue.arrayUnion(userId),
      likeCount: admin.firestore.FieldValue.increment(liked ? -1 : 1),
    });
    return {
      postId,
      liked: !liked,
      likeCount: (data.likeCount || 0) + (liked ? -1 : 1),
    };
  });
}

module.exports = {
  listForums,
  createForum,
  getForum,
  listPosts,
  createPost,
  toggleLike,
};
