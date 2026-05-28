// Spotify constants: OAuth scopes, endpoint URLs, and time-range mapping.

const SCOPES = [
  'user-read-private', // profile: display_name, country, product
  'user-read-email', // email on /me
  'user-top-read', // top artists + tracks
  'user-library-read', // liked / saved tracks
].join(' ');

const URLS = {
  authorize: 'https://accounts.spotify.com/authorize',
  token: 'https://accounts.spotify.com/api/token',
  apiBase: 'https://api.spotify.com/v1',
};

// UI range key -> Spotify time_range param.
const TIME_RANGE = {
  all_time: 'long_term',
  six_months: 'medium_term',
  one_month: 'short_term',
};

// Maps a UI range key to the Spotify param, throwing for unknown keys.
function resolveTimeRange(rangeKey) {
  return TIME_RANGE[rangeKey];
}

module.exports = { SCOPES, URLS, resolveTimeRange };
