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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
