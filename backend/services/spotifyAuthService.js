// Spotify OAuth Authorization Code flow: build authorize URL, exchange code
// for tokens, refresh tokens. All token requests use Basic client auth.
const axios = require('axios');
const { config } = require('../config/env');
const { SCOPES, URLS } = require('../config/spotify');
const HttpError = require('../utils/httpError');

function basicAuthHeader() {
  const creds = `${config.spotify.clientId}:${config.spotify.clientSecret}`;
  return `Basic ${Buffer.from(creds).toString('base64')}`;
}

function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: config.spotify.clientId,
    response_type: 'code',
    redirect_uri: config.spotify.redirectUri,
    scope: SCOPES,
    state,
  });
  return `${URLS.authorize}?${params.toString()}`;
}

async function postToken(body) {
  try {
    const res = await axios.post(URLS.token, body.toString(), {
      headers: {
        Authorization: basicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return res.data; // { access_token, refresh_token?, expires_in, scope, ... }
  } catch (err) {
    const detail = err.response?.data?.error_description || err.message;
    throw new HttpError(502, `Spotify token request failed: ${detail}`, 'spotify_token_error');
  }
}

async function exchangeCodeForTokens(code) {
  return postToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.spotify.redirectUri,
    })
  );
}

async function refreshAccessToken(refreshToken) {
  return postToken(
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })
  );
}

module.exports = { buildAuthorizeUrl, exchangeCodeForTokens, refreshAccessToken };
