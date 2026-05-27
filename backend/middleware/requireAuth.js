// Authentication gate for /api routes. Verifies the session cookie, loads the
// user, and attaches req.user (no tokens) + a lazy req.getAccessToken().
const { COOKIE_NAME, verifySession } = require('../services/sessionService');
const { getById, toSelfUser } = require('../services/userService');
const { getValidAccessToken } = require('../services/tokenService');
const HttpError = require('../utils/httpError');
const asyncHandler = require('./asyncHandler');

module.exports = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  const spotifyUserId = verifySession(token);
  if (!spotifyUserId) {
    throw new HttpError(401, 'Not authenticated', 'unauthenticated');
  }

  const snap = await getById(spotifyUserId);
  if (!snap) {
    throw new HttpError(401, 'Session user no longer exists', 'unauthenticated');
  }

  req.user = toSelfUser(snap); // { id, profile, isPrivate, displayed*, ... } — no tokens
  // Lazy: only Spotify routes call this, so DM/forum routes never trigger a refresh.
  req.getAccessToken = () => getValidAccessToken(spotifyUserId);
  next();
});
