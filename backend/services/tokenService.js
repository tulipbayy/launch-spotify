// Returns a valid Spotify access token for a user, refreshing + persisting
// when the stored one is expired (or within a 60s skew buffer).
const { userRef } = require('./userService');
const { refreshAccessToken } = require('./spotifyAuthService');
const HttpError = require('../utils/httpError');

const SKEW_MS = 60 * 1000;

async function getValidAccessToken(spotifyUserId) {
  const snap = await userRef(spotifyUserId).get();
  if (!snap.exists) throw new HttpError(401, 'User not found', 'user_not_found');

  const spotify = snap.data().spotify;
  if (!spotify?.refreshToken) {
    throw new HttpError(401, 'No Spotify tokens on file', 'no_spotify_tokens');
  }

  if (Date.now() < spotify.expiresAt - SKEW_MS) {
    return spotify.accessToken;
  }

  // Expired (or about to): refresh and persist.
  const refreshed = await refreshAccessToken(spotify.refreshToken);
  const updated = {
    accessToken: refreshed.access_token,
    // Spotify may omit refresh_token on refresh — keep the existing one.
    refreshToken: refreshed.refresh_token || spotify.refreshToken,
    expiresAt: Date.now() + refreshed.expires_in * 1000,
    scope: refreshed.scope || spotify.scope || '',
  };
  await userRef(spotifyUserId).update({ spotify: updated });
  return updated.accessToken;
}

module.exports = { getValidAccessToken };
