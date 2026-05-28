// Centralized environment configuration + validation.
// Reads process.env once, validates required keys, exports a typed config object.
require('dotenv').config();

const config = {
  port: Number(process.env.PORT) || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://127.0.0.1:5173',
  sessionSecret: process.env.SESSION_SECRET,
  isProd: process.env.NODE_ENV === 'production',

  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri:
      process.env.SPOTIFY_REDIRECT_URI ||
      'http://127.0.0.1:5000/auth/callback',
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
};

// Required at boot. Skipped when CI=true so the build/lint can run without secrets.
const REQUIRED = [
  ['SESSION_SECRET', config.sessionSecret],
  ['SPOTIFY_CLIENT_ID', config.spotify.clientId],
  ['SPOTIFY_CLIENT_SECRET', config.spotify.clientSecret],
  ['FIREBASE_PROJECT_ID', config.firebase.projectId],
  ['FIREBASE_CLIENT_EMAIL', config.firebase.clientEmail],
  ['FIREBASE_PRIVATE_KEY', config.firebase.privateKey],
];

function validateEnv() {
  if (process.env.CI === 'true') return;
  const missing = REQUIRED.filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'See backend/.env.example.'
    );
  }
}

module.exports = { config, validateEnv };
