require('dotenv').config();
const express = require("express");
const cors = require("cors");
const adminDb = require("./firebaseAdmin");

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Spotify backend is running.');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// --- Spotify OAuth routes ---
app.get('/auth/login', (req, res) => {
  const scope = [
    'user-read-email',
    'user-read-private',
    'user-top-read',
    'user-library-read',
  ].join(' ')

  const state = Math.random().toString(36).slice(2)
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    state,
  })

  return res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`)
})

app.get('/auth/callback', async (req, res) => {
  try {
    const code = req.query.code
    if (!code) return res.status(400).send('Missing code')

    const tokenUrl = 'https://accounts.spotify.com/api/token'
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code.toString(),
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    })

    const basic = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64')

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      console.error('Token response error', tokenData)
      return res.status(500).json({ error: 'Failed to obtain access token' })
    }

    // fetch Spotify profile
    const headers = { Authorization: `Bearer ${tokenData.access_token}` }
    const meRes = await fetch('https://api.spotify.com/v1/me', { headers })
    const me = await meRes.json()
    const spotifyId = me.id || `unknown-${Date.now()}`
    const avatar = me.images?.[0]?.url || null

    // fetch top Spotify artists and tracks for the authenticated user
    const [topArtistsRes, topTracksRes] = await Promise.all([
      fetch('https://api.spotify.com/v1/me/top/artists?limit=8', { headers }),
      fetch('https://api.spotify.com/v1/me/top/tracks?limit=8', { headers }),
    ])

    const topArtistsData = await topArtistsRes.json()
    const topTracksData = await topTracksRes.json()

    const topArtists = (topArtistsData.items || []).map((artist) => ({
      name: artist.name,
      subtitle: artist.genres?.[0] || artist.type || 'Artist',
      image: artist.images?.[0]?.url,
    }))

    const topSongs = (topTracksData.items || []).map((track) => ({
      name: track.name,
      subtitle: track.artists?.map((artist) => artist.name).join(', ') || 'Unknown Artist',
      image: track.album?.images?.[0]?.url,
    }))

    // preserve any custom display name or bio, and merge updated Spotify fields
    const profileRef = adminDb.collection('profiles').doc(spotifyId)
    const existingSnapshot = await profileRef.get()
    const existingData = existingSnapshot.exists ? existingSnapshot.data() : {}
    const displayName = existingData?.displayName || me.display_name || me.id || 'Spotify User'
    const bio = existingData?.bio ?? ''

    try {
      await profileRef.set(
        {
          spotifyId,
          spotifyRefreshToken: tokenData.refresh_token,
          spotifyAccessToken: tokenData.access_token,
          spotifyTokenExpiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
          displayName,
          bio,
          avatar,
          email: me.email,
          topArtists,
          topSongs,
        },
        { merge: true }
      )
    } catch (e) {
      console.error('Failed saving tokens to Firestore', e)
    }

    // redirect back to the profile page so the frontend loads the Spotify user
    return res.redirect(`${FRONTEND_URL}/profile?spotifyId=${encodeURIComponent(spotifyId)}`)
  } catch (err) {
    console.error('Error in /auth/callback', err)
    return res.status(500).json({ error: 'OAuth callback error' })
  }
})

app.post('/auth/refresh', express.json(), async (req, res) => {
  try {
    const spotifyId = req.body.spotifyId
    let refresh_token = req.body.refresh_token

    if (!refresh_token && spotifyId) {
      const snapshot = await adminDb.collection('profiles').doc(spotifyId).get()
      if (!snapshot.exists) return res.status(404).json({ error: 'Profile not found' })
      refresh_token = snapshot.data()?.spotifyRefreshToken
    }

    if (!refresh_token) return res.status(400).json({ error: 'Missing refresh token' })

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
    })

    const basic = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64')

    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const data = await tokenRes.json()

    // optionally update stored access token expiry
    if (spotifyId && data.access_token) {
      await adminDb.collection('profiles').doc(spotifyId).set(
        {
          spotifyAccessToken: data.access_token,
          spotifyTokenExpiresAt: Date.now() + (data.expires_in || 3600) * 1000,
        },
        { merge: true }
      )
    }

    return res.json(data)
  } catch (error) {
    console.error('Error refreshing token', error)
    return res.status(500).json({ error: 'Failed to refresh token' })
  }
})

app.get('/api/profile', async (req, res) => {
  try {
    const userId = req.query.userId || 'demo-user';
    const profileDoc = adminDb.collection('profiles').doc(userId.toString());
    const snapshot = await profileDoc.get();

    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const data = snapshot.data();
    return res.json({
      id: snapshot.id,
      displayName: data?.displayName || 'Username',
      bio: data?.bio || '',
      avatar: data?.avatar || null,
      isPublic: data?.isPublic ?? true,
      showArtists: data?.showArtists ?? true,
      showSongs: data?.showSongs ?? true,
      topArtists: data?.topArtists || [],
      topSongs: data?.topSongs || [],
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    return res.status(500).json({ error: 'Unable to load profile' });
  }
});

// Update or merge profile fields for a user
app.post('/api/profile', async (req, res) => {
  try {
    const userId = req.body.userId
    const data = req.body.data

    if (!userId) return res.status(400).json({ error: 'Missing userId' })
    if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Missing data' })

    // whitelist fields we allow users to update
    const allowed = [
      'displayName',
      'bio',
      'isPublic',
      'showArtists',
      'showSongs',
      'topArtists',
      'topSongs',
    ]

    const sanitized = {}
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(data, key)) sanitized[key] = data[key]
    }

    await adminDb.collection('profiles').doc(userId.toString()).set(sanitized, { merge: true })
    return res.json({ ok: true })
  } catch (err) {
    console.error('Error saving profile:', err)
    return res.status(500).json({ error: 'Failed to save profile' })
  }
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
