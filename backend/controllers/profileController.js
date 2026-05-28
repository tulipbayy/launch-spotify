// Self-profile read + edits (display name/bio, public/private, displayed items).
const { getById, toSelfUser, updateProfile } = require('../services/userService');
const HttpError = require('../utils/httpError');

async function getMine(req, res) {
  const snap = await getById(req.user.id);
  res.json({ user: toSelfUser(snap) });
}

// PATCH /api/profile { displayName?, bio? }
async function update(req, res) {
  const { displayName, bio } = req.body || {};
  const fields = {};
  if (typeof displayName === 'string') fields.displayName = displayName.trim();
  if (typeof bio === 'string') fields.bio = bio.trim();
  if (!Object.keys(fields).length) {
    throw new HttpError(400, 'Nothing to update', 'empty_update');
  }
  const user = await updateProfile(req.user.id, fields);
  res.json({ user });
}

// PATCH /api/profile/visibility { isPrivate }
async function setVisibility(req, res) {
  const { isPrivate } = req.body || {};
  if (typeof isPrivate !== 'boolean') {
    throw new HttpError(400, 'isPrivate must be a boolean', 'bad_visibility');
  }
  const user = await updateProfile(req.user.id, { isPrivate });
  res.json({ user });
}

// PUT /api/profile/displayed { displayedArtistIds?, displayedSongIds? }
async function setDisplayed(req, res) {
  const { displayedArtistIds, displayedSongIds } = req.body || {};
  const fields = {};
  if (Array.isArray(displayedArtistIds)) fields.displayedArtistIds = displayedArtistIds;
  if (Array.isArray(displayedSongIds)) fields.displayedSongIds = displayedSongIds;
  if (!Object.keys(fields).length) {
    throw new HttpError(400, 'Nothing to update', 'empty_update');
  }
  const user = await updateProfile(req.user.id, fields);
  res.json({ user });
}

module.exports = { getMine, update, setVisibility, setDisplayed };
