// App session = signed JWT carrying only the Spotify user id.
// Stored in an HTTP-only cookie so the token never touches client JS.
const jwt = require('jsonwebtoken');
const { config } = require('../config/env');

const COOKIE_NAME = 'session';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function signSession(spotifyUserId) {
  return jwt.sign({ sub: spotifyUserId }, config.sessionSecret, {
    expiresIn: '7d',
  });
}

// Returns the spotifyUserId, or null if the token is missing/invalid/expired.
function verifySession(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.sessionSecret);
    return payload.sub || null;
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProd,
  maxAge: MAX_AGE_MS,
  path: '/',
};

module.exports = { COOKIE_NAME, signSession, verifySession, cookieOptions };
