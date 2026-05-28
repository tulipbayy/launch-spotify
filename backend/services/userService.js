// Firestore users collection (flat schema). Upsert on login, profile
// reads/writes, and shapers that strip Spotify tokens before data leaves the server.
const admin = require('firebase-admin');
const db = require('../firebaseAdmin');

const USERS = 'users';

function userRef(spotifyUserId) {
  return db.collection(USERS).doc(spotifyUserId);
}

// Self view: everything except the raw Spotify tokens.
function toSelfUser(doc) {
  const d = doc.data();
  if (!d) return null;
  return {
    id: doc.id,
    displayName: d.displayName || '',
    bio: d.bio || '',
    email: d.email || null,
    pfp: d.pfp || null,
    // Missing isPrivate = private (safe default).
    isPrivate: d.isPrivate !== false,
    displayedArtistIds: d.displayedArtistIds || [],
    displayedSongIds: d.displayedSongIds || [],
  };
}

// Public view: no tokens, no email.
function toPublicUser(doc) {
  const self = toSelfUser(doc);
  if (!self) return null;
  return {
    id: self.id,
    displayName: self.displayName,
    bio: self.bio,
    pfp: self.pfp,
    displayedArtistIds: self.displayedArtistIds,
    displayedSongIds: self.displayedSongIds,
  };
}

// Create-or-update a user from a Spotify /me payload + fresh tokens.
async function upsertFromSpotify(me, tokens) {
  const ref = userRef(me.id);
  const now = admin.firestore.FieldValue.serverTimestamp();

  // Spotify-sourced fields refreshed on every login.
  const spotifyFields = {
    email: me.email || null,
    pfp: me.images?.[0]?.url || null,
  };
  const tokenFields = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiresAt: Date.now() + tokens.expires_in * 1000,
    scope: tokens.scope || '',
  };

  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      spotifyId: me.id,
      displayName: me.display_name || me.id,
      bio: '',
      ...spotifyFields,
      isPrivate: true, // private by default
      displayedArtistIds: [],
      displayedSongIds: [],
      ...tokenFields,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    });
  } else {
    // Preserve user-edited displayName/bio; refresh Spotify fields + tokens.
    await ref.update({ ...spotifyFields, ...tokenFields, lastLoginAt: now, updatedAt: now });
  }
  return me.id;
}

async function getById(spotifyUserId) {
  const snap = await userRef(spotifyUserId).get();
  return snap.exists ? snap : null;
}

// Apply a partial profile update; returns the refreshed self view.
async function updateProfile(spotifyUserId, fields) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  await userRef(spotifyUserId).update({ ...fields, updatedAt: now });
  const snap = await userRef(spotifyUserId).get();
  return toSelfUser(snap);
}

// List public users. Public = isPrivate !== true. Filtered + sorted in JS so
// docs missing the field are handled and no composite index is required.
async function listPublic({ limit = 20, cursorId = null } = {}) {
  const snap = await db.collection(USERS).get();
  let docs = snap.docs
    .filter((d) => d.data().isPrivate !== true)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  if (cursorId) {
    const idx = docs.findIndex((d) => d.id === cursorId);
    if (idx >= 0) docs = docs.slice(idx + 1);
  }

  const hasMore = docs.length > limit;
  const page = hasMore ? docs.slice(0, limit) : docs;
  return {
    users: page.map(toPublicUser),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

// Display name for a user id (used to denormalize into forums/posts/conversations).
async function displayNameOf(spotifyUserId) {
  const snap = await userRef(spotifyUserId).get();
  return snap.exists ? snap.data().displayName || spotifyUserId : spotifyUserId;
}

module.exports = {
  userRef,
  toSelfUser,
  toPublicUser,
  upsertFromSpotify,
  getById,
  updateProfile,
  listPublic,
  displayNameOf,
};
