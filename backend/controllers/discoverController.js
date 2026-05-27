// Public user discovery + viewing another user's profile.
const { getById, toPublicUser, listPublic } = require('../services/userService');
const spotify = require('../services/spotifyApiService');
const HttpError = require('../utils/httpError');

// GET /api/users?cursor=&limit= -> public users, excluding self.
async function list(req, res) {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const cursorId = req.query.cursor || null;
  const { users, nextCursor } = await listPublic({ limit, cursorId });
  res.json({ users: users.filter((u) => u.id !== req.user.id), nextCursor });
}

// GET /api/users/:userId -> public profile + hydrated displayed artists/songs.
async function getOne(req, res) {
  const { userId } = req.params;
  const snap = await getById(userId);
  if (!snap) throw new HttpError(404, 'User not found', 'user_not_found');

  const data = snap.data();
  const isSelf = userId === req.user.id;
  if (!data.isPublic && !isSelf) {
    throw new HttpError(403, 'This profile is private', 'profile_private');
  }

  // Hydrate the displayed ids to full metadata using the *viewer's* token
  // (public catalog endpoints — no need for the profile owner's token).
  const accessToken = await req.getAccessToken();
  const [displayedArtists, displayedSongs] = await Promise.all([
    spotify.getArtistsByIds(accessToken, data.displayedArtists || []),
    spotify.getTracksByIds(accessToken, data.displayedSongs || []),
  ]);

  res.json({ user: toPublicUser(snap), displayedArtists, displayedSongs });
}

module.exports = { list, getOne };
