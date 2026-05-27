// Firestore users collection: upsert on login, profile reads/writes, and
// shapers that strip Spotify tokens (and email) before data leaves the server.
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
    spotifyProfile: d.spotifyProfile || null,
    profile: d.profile || { displayName: '', bio: '' },
    // Canonical visibility field is `isPrivate`. Missing = private (safe default).
    isPrivate: d.isPrivate !== false,
    displayedArtists: d.displayedArtists || [],
    displayedSongs: d.displayedSongs || [],
    displayedRange: d.displayedRange || 'all_time',
  };
}

// Public view: no tokens, no email.
function toPublicUser(doc) {
  const self = toSelfUser(doc);
  if (!self) return null;
  // Strip email from the public view.
  const { email: _email, ...spotifyProfile } = self.spotifyProfile || {};
  void _email;
  return {
    id: self.id,
    spotifyProfile,
    profile: self.profile,
    displayedArtists: self.displayedArtists,
    displayedSongs: self.displayedSongs,
    displayedRange: self.displayedRange,
  };
}

// Create-or-update a user from a Spotify /me payload + fresh tokens.
async function upsertFromSpotify(me, tokens) {
  const ref = userRef(me.id);
  const now = admin.firestore.FieldValue.serverTimestamp();
  const spotifyProfile = {
    displayName: me.display_name || me.id,
    email: me.email || null,
    imageUrl: me.images?.[0]?.url || null,
    country: me.country || null,
    product: me.product || null,
  };
  const spotify = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    scope: tokens.scope || '',
  };

  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      spotifyProfile,
      profile: { displayName: spotifyProfile.displayName, bio: '' },
      isPrivate: true, // private by default
      displayedArtists: [],
      displayedSongs: [],
      displayedRange: 'all_time',
      spotify,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    });
  } else {
    await ref.update({ spotifyProfile, spotify, lastLoginAt: now, updatedAt: now });
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

// List public users. Public = isPrivate !== true. Filtered + sorted in JS
// (not via a Firestore where/orderBy) so docs missing the field are handled
// and no composite index is required. Pagination trimmed in memory.
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

module.exports = {
  USERS,
  userRef,
  toSelfUser,
  toPublicUser,
  upsertFromSpotify,
  getById,
  updateProfile,
  listPublic,
};
