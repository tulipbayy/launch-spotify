// OAuth endpoints + session lifecycle.
const crypto = require('crypto');
const { config } = require('../config/env');
const {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
} = require('../services/spotifyAuthService');
const { getMe } = require('../services/spotifyApiService');
const { upsertFromSpotify, getById, toSelfUser } = require('../services/userService');
const {
  COOKIE_NAME,
  signSession,
  cookieOptions,
} = require('../services/sessionService');

const STATE_COOKIE = 'spotify_oauth_state';
const stateCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProd,
  maxAge: 10 * 60 * 1000, // 10 minutes
  path: '/',
};

// GET /auth/login -> redirect to Spotify consent.
function login(req, res) {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, state, stateCookieOptions);
  res.redirect(buildAuthorizeUrl(state));
}

// GET /auth/callback -> exchange code, upsert user, set session cookie.
async function callback(req, res) {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${config.frontendUrl}/?auth=error`);

  const expectedState = req.cookies?.[STATE_COOKIE];
  if (!state || !expectedState || state !== expectedState) {
    return res.redirect(`${config.frontendUrl}/?auth=state_mismatch`);
  }
  res.clearCookie(STATE_COOKIE, { path: '/' });

  const tokens = await exchangeCodeForTokens(code);
  const me = await getMe(tokens.access_token);
  const userId = await upsertFromSpotify(me, tokens);

  res.cookie(COOKIE_NAME, signSession(userId), cookieOptions);
  // res.redirect(`${config.frontendUrl}/`);
  res.redirect(`${config.frontendUrl}/profile?spotifyId=${userId}&accessToken=${tokens.access_token}`);
}

// GET /auth/me -> current user's self profile (no tokens).
async function me(req, res) {
  const snap = await getById(req.user.id);
  res.json({ user: toSelfUser(snap) });
}

// POST /auth/logout -> clear session cookie.
function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
}

module.exports = { login, callback, me, logout };
