// Returns a valid Spotify access token for a user, refreshing + persisting
// when the stored one is expired (or within a 60s skew buffer).
const { userRef } = require('./userService');
const { refreshAccessToken } = require('./spotifyAuthService');
const HttpError = require('../utils/httpError');

const SKEW_MS = 60 * 1000;

async function getValidAccessToken(spotifyUserId) {
  const snap = await userRef(spotifyUserId).get();
  if (!snap.exists) throw new HttpError(401, 'User not found', 'user_not_found');

  const d = snap.data();
  if (!d.refreshToken) {
    throw new HttpError(401, 'No Spotify tokens on file', 'no_spotify_tokens');
  }

  if (Date.now() < d.tokenExpiresAt - SKEW_MS) {
    return d.accessToken;
  }

  // Expired (or about to): refresh and persist.
  const refreshed = await refreshAccessToken(d.refreshToken);
  const updated = {
    accessToken: refreshed.access_token,
    // Spotify may omit refresh_token on refresh — keep the existing one.
    refreshToken: refreshed.refresh_token || d.refreshToken,
    tokenExpiresAt: Date.now() + refreshed.expires_in * 1000,
    scope: refreshed.scope || d.scope || '',
  };
  await userRef(spotifyUserId).update(updated);
  return updated.accessToken;
}

module.exports = { getValidAccessToken };
