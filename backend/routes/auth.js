import express from 'express';
import crypto from 'node:crypto';
import db from '../firebaseAdmin.js';

const router = express.Router();
const spotifyAccountsUrl = 'https://accounts.spotify.com';
const spotifyApiUrl = 'https://api.spotify.com/v1';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
const spotifyScopes = [
    'user-read-email', 
    'user-read-private', 
    'user-follow-modify',
    'user-follow-read',
    'user-top-read',
    'user-read-recently-played',
    'user-library-read',
    'playlist-read-private', 
    'playlist-read-collaborative', 
    'playlist-modify-private',
    'playlist-modify-public',
];

function getSpotifyConfig() {
    const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } = process.env;

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
        return null;
    }

    return {
        clientId: SPOTIFY_CLIENT_ID,
        clientSecret: SPOTIFY_CLIENT_SECRET,
        redirectUri: SPOTIFY_REDIRECT_URI,
    };
}

function buildFrontendRedirect(path, params={}) {
    const redirectUrl = new URL(path, frontendUrl);
    
    Object.entries(params).forEach(([key, value]) => {
        if (value) {
            redirectUrl.searchParams.set(key, value);
        }
    })
    return redirectUrl.toString();
}

function encodeUser(user) {
    return Buffer.from(JSON.stringify(user)).toString('base64url');
}

function buildSpotifyUser(profile) {
    return {
        id: profile.id,
        username: profile.display_name || profile.id,
        email: profile.email || '',
        imageUrl: profile.images?.[0]?.url || '',
        provider: 'spotify',
    };
}

function buildLimitedSpotifyUser() {
    return {
        id: `spotify-${crypto.randomUUID()}`,
        username: 'Spotify user',
        email: '',
        imageUrl: '',
        provider: 'spotify',
        profileLimited: true,
    };
}

function getCookie(req, cookieName) {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return '';
  }

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((cookie) => {
      const [name, ...valueParts] = cookie.trim().split('=');
      try {
        return [name, decodeURIComponent(valueParts.join('='))];
      } catch {
        return [name, valueParts.join('=')];
      }
    })
  );

  return cookies[cookieName] || '';
}

async function getSpotifyErrorMessage(response, fallbackMessage) {
  const responseText = await response.text();

  if (!responseText) {
    return fallbackMessage;
  }

  try {
    const responseBody = JSON.parse(responseText);
    return responseBody.error_description || responseBody.error?.message || responseBody.error || fallbackMessage;
  } catch {
    return responseText;
  }
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await validateUser(username, password);

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    return res.status(200).json({ id: user.id, username: user.username });
  } catch (error) {
    console.error('Error validating user:', error);
    return res.status(500).json({ message: 'Could not validate user' });
  }
})

router.get('/spotify', (req, res) => {
  const config = getSpotifyConfig();

  if (!config) {
    return res.status(500).json({ message: 'Spotify auth is not configured' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const authorizeUrl = new URL('/authorize', spotifyAccountsUrl);
  authorizeUrl.searchParams.set('client_id', config.clientId);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('redirect_uri', config.redirectUri);
  authorizeUrl.searchParams.set('scope', spotifyScopes.join(' '));
  authorizeUrl.searchParams.set('state', state);

  res.cookie('spotify_auth_state', state, {
    httpOnly: true,
    maxAge: 10 * 60 * 1000,
    sameSite: 'lax',
  });

  return res.redirect(authorizeUrl.toString());
})

router.get('/spotify/callback', async (req, res) => {
  const config = getSpotifyConfig();
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(buildFrontendRedirect('/spotify/callback', { error }));
  }

  if (!config) {
    return res.redirect(buildFrontendRedirect('/spotify/callback', { error: 'Spotify auth is not configured' }));
  }

  const savedState = getCookie(req, 'spotify_auth_state');

  if (!code || !state || savedState !== state) {
    console.error('Spotify state mismatch:', {
      hasCode: Boolean(code),
      hasState: Boolean(state),
      hasSavedState: Boolean(savedState),
    })
    return res.redirect(buildFrontendRedirect('/spotify/callback', { error: 'Invalid Spotify login attempt' }));
  }

  res.clearCookie('spotify_auth_state');

  try {
    const tokenResponse = await fetch(`${spotifyAccountsUrl}/api/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const spotifyError = await getSpotifyErrorMessage(
        tokenResponse,
        `Spotify token exchange failed with ${tokenResponse.status}`
      );
      throw new Error(`Spotify token exchange failed: ${spotifyError}`);
    }

    const tokenData = await tokenResponse.json();
    const profileResponse = await fetch(`${spotifyApiUrl}/me`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      const spotifyError = await getSpotifyErrorMessage(
        profileResponse,
        `Spotify profile request failed with ${profileResponse.status}`
      );

      if (spotifyError.toLowerCase().includes('active premium subscription required')) {
        console.warn('Spotify profile request blocked by development-mode Premium requirement.');
        return res.redirect(buildFrontendRedirect('/spotify/callback', { user: encodeUser(buildLimitedSpotifyUser()) }));
      }

      throw new Error(`Spotify profile request failed: ${spotifyError}`);
    }

    const profile = await profileResponse.json();

    const userData = {
        spotifyId: profile.id,
        username: profile.display_name || profile.id,
        email: profile.email || '',
        isPrivate: false,
        biography: '',
        profilePhoto: profile.images?.[0]?.url || '',
    };

    await db.collection('users').doc(profile.id).set(userData, { merge: true });

    return res.redirect(buildFrontendRedirect('/spotify/callback', { user: encodeUser(buildSpotifyUser(profile)) }));
  } catch (callbackError) {
    console.error('Error completing Spotify auth:', callbackError);
    return res.redirect(buildFrontendRedirect('/spotify/callback', { error: callbackError.message }));
  }
})

export default router;