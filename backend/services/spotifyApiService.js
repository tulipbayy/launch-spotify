// Thin wrapper around the Spotify Web API. Each function takes a valid access
// token and returns shaped, frontend-friendly objects. 401s become a typed
// HttpError so callers can decide whether to refresh-and-retry.
const axios = require('axios');
const { URLS, resolveTimeRange } = require('../config/spotify');
const HttpError = require('../utils/httpError');

function client(accessToken) {
  return axios.create({
    baseURL: URLS.apiBase,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

function wrapSpotifyError(err) {
  const status = err.response?.status;
  if (status === 401) return new HttpError(401, 'Spotify token rejected', 'spotify_unauthorized');
  if (status === 429) {
    return new HttpError(429, 'Spotify rate limit', 'spotify_rate_limited');
  }
  const detail = err.response?.data?.error?.message || err.message;
  return new HttpError(502, `Spotify API error: ${detail}`, 'spotify_api_error');
}

async function get(accessToken, path, params) {
  try {
    const res = await client(accessToken).get(path, { params });
    return res.data;
  } catch (err) {
    throw wrapSpotifyError(err);
  }
}

// --- shapers ---
function shapeArtist(a) {
  return { id: a.id, name: a.name, images: a.images || [], genres: a.genres || [], externalUrl: a.external_urls?.spotify || null };
}
function shapeTrack(t) {
  return {
    id: t.id,
    name: t.name,
    duration_ms: t.duration_ms || 0,
    artists: (t.artists || []).map((ar) => ar.name),
    album: { name: t.album?.name || '', images: t.album?.images || [] },
    externalUrl: t.external_urls?.spotify || null,
    previewUrl: t.preview_url || null,
  };
}

// --- API ---
async function getMe(accessToken) {
  return get(accessToken, '/me');
}

async function getTopArtists(accessToken, rangeKey) {
  const time_range = resolveTimeRange(rangeKey);
  if (!time_range) throw new HttpError(400, `Invalid range: ${rangeKey}`, 'bad_range');
  const data = await get(accessToken, '/me/top/artists', { time_range, limit: 50 });
  return (data.items || []).map(shapeArtist);
}

async function getTopTracks(accessToken, rangeKey) {
  const time_range = resolveTimeRange(rangeKey);
  if (!time_range) throw new HttpError(400, `Invalid range: ${rangeKey}`, 'bad_range');
  const data = await get(accessToken, '/me/top/tracks', { time_range, limit: 50 });
  return (data.items || []).map(shapeTrack);
}

async function getLikedTracks(accessToken, { limit = 50, offset = 0 } = {}) {
  const data = await get(accessToken, '/me/tracks', { limit, offset });
  const items = (data.items || []).map((item) => ({
    ...shapeTrack(item.track),
    addedAt: item.added_at,
  }));
  return { items, next: data.next, total: data.total };
}

// Public catalog lookups (used to hydrate another user's displayed ids).
async function getArtistsByIds(accessToken, ids) {
  if (!ids.length) return [];
  const data = await get(accessToken, '/artists', { ids: ids.join(',') });
  return (data.artists || []).filter(Boolean).map(shapeArtist);
}

async function getTracksByIds(accessToken, ids) {
  if (!ids.length) return [];
  const data = await get(accessToken, '/tracks', { ids: ids.join(',') });
  return (data.tracks || []).filter(Boolean).map(shapeTrack);
}

module.exports = {
  getMe,
  getTopArtists,
  getTopTracks,
  getLikedTracks,
  getArtistsByIds,
  getTracksByIds,
};
