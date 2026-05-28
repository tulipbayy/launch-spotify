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
  const profile = {};
  if (typeof displayName === 'string') profile.displayName = displayName.trim();
  if (typeof bio === 'string') profile.bio = bio.trim();
  if (!Object.keys(profile).length) {
    throw new HttpError(400, 'Nothing to update', 'empty_update');
  }
  // Merge into the existing profile map.
  const current = req.user.profile || {};
  const user = await updateProfile(req.user.id, { profile: { ...current, ...profile } });
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

// PUT /api/profile/displayed { displayedArtists?, displayedSongs? }
async function setDisplayed(req, res) {
  const { displayedArtists, displayedSongs } = req.body || {};
  const fields = {};
  if (Array.isArray(displayedArtists)) fields.displayedArtists = displayedArtists;
  if (Array.isArray(displayedSongs)) fields.displayedSongs = displayedSongs;
  if (!Object.keys(fields).length) {
    throw new HttpError(400, 'Nothing to update', 'empty_update');
  }
  const user = await updateProfile(req.user.id, fields);
  res.json({ user });
}

module.exports = { getMine, update, setVisibility, setDisplayed };
