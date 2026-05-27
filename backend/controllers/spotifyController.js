// Spotify data endpoints. Each pulls a valid access token via req.getAccessToken()
// and retries once if Spotify rejects the token mid-flight (spotify_unauthorized).
const spotify = require('../services/spotifyApiService');

// Runs fn(accessToken); on a 401 from Spotify, forces a token refresh and retries once.
async function withToken(req, fn) {
  let accessToken = await req.getAccessToken();
  try {
    return await fn(accessToken);
  } catch (err) {
    if (err.code !== 'spotify_unauthorized') throw err;
    accessToken = await req.getAccessToken(); // tokenService refreshes if needed
    return fn(accessToken);
  }
}

async function me(req, res) {
  const profile = await withToken(req, (t) => spotify.getMe(t));
  res.json({ profile });
}

async function topArtists(req, res) {
  const range = req.query.range || 'all_time';
  const items = await withToken(req, (t) => spotify.getTopArtists(t, range));
  res.json({ range, items });
}

async function topTracks(req, res) {
  const range = req.query.range || 'all_time';
  const items = await withToken(req, (t) => spotify.getTopTracks(t, range));
  res.json({ range, items });
}

async function liked(req, res) {
  const limit = Math.min(Number(req.query.limit) || 50, 50);
  const offset = Number(req.query.offset) || 0;
  const data = await withToken(req, (t) => spotify.getLikedTracks(t, { limit, offset }));
  res.json(data);
}

module.exports = { me, topArtists, topTracks, liked, withToken };
