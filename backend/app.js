app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SpotSocial backend is running.");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.get("/auth/login", (req, res) => {
  const scope = [
    "user-read-email",
    "user-read-private",
    "user-top-read",
    "user-library-read",
  ].join(" ");

  const state = Math.random().toString(36).slice(2);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    state,
  });

  return res.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
});

app.get("/auth/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send("Missing code");

    const tokenUrl = "https://accounts.spotify.com/api/token";
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: code.toString(),
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    });

    const basic = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Token response error", tokenData);
      return res.status(500).json({ error: "Failed to obtain access token" });
    }

    const headers = { Authorization: `Bearer ${tokenData.access_token}` };
    const meRes = await fetch("https://api.spotify.com/v1/me", { headers });
    const me = await meRes.json();
    const spotifyId = me.id || `unknown-${Date.now()}`;
    const avatar = me.images?.[0]?.url || null;

    const [topArtistsRes, topTracksRes] = await Promise.all([
      fetch("https://api.spotify.com/v1/me/top/artists?limit=8", { headers }),
      fetch("https://api.spotify.com/v1/me/top/tracks?limit=8", { headers }),
    ]);

    const topArtistsData = await topArtistsRes.json();
    const topTracksData = await topTracksRes.json();

    const topArtists = (topArtistsData.items || []).map((artist) => ({
      name: artist.name,
      subtitle: artist.genres?.[0] || artist.type || "Artist",
      image: artist.images?.[0]?.url,
    }));

    const topSongs = (topTracksData.items || []).map((track) => ({
      name: track.name,
      subtitle:
        track.artists?.map((artist) => artist.name).join(", ") ||
        "Unknown Artist",
      image: track.album?.images?.[0]?.url,
    }));

    const profileRef = adminDb.collection("profiles").doc(spotifyId);
    const existingSnapshot = await profileRef.get();
    const existingData = existingSnapshot.exists ? existingSnapshot.data() : {};
    const displayName =
      existingData?.displayName || me.display_name || me.id || "Spotify User";
    const bio = existingData?.bio ?? "";

    try {
      await profileRef.set(
        {
          spotifyId,
          spotifyRefreshToken: tokenData.refresh_token,
          spotifyAccessToken: tokenData.access_token,
          spotifyTokenExpiresAt:
            Date.now() + (tokenData.expires_in || 3600) * 1000,
          displayName,
          bio,
          avatar,
          email: me.email,
          topArtists,
          topSongs,
        },
        { merge: true }
      );
    } catch (e) {
      console.error("Failed saving tokens to Firestore", e);
    }

    return res.redirect(
      `${FRONTEND_URL}/profile?spotifyId=${encodeURIComponent(spotifyId)}`
    );
  } catch (err) {
    console.error("Error in /auth/callback", err);
    return res.status(500).json({ error: "OAuth callback error" });
  }
});

app.post("/auth/refresh", express.json(), async (req, res) => {
  try {
    const spotifyId = req.body.spotifyId;
    let refresh_token = req.body.refresh_token;

    if (!refresh_token && spotifyId) {
      const snapshot = await adminDb
        .collection("profiles")
        .doc(spotifyId)
        .get();
      if (!snapshot.exists)
        return res.status(404).json({ error: "Profile not found" });
      refresh_token = snapshot.data()?.spotifyRefreshToken;
    }

    if (!refresh_token)
      return res.status(400).json({ error: "Missing refresh token" });

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
    });

    const basic = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await tokenRes.json();

    if (spotifyId && data.access_token) {
      await adminDb
        .collection("profiles")
        .doc(spotifyId)
        .set(
          {
            spotifyAccessToken: data.access_token,
            spotifyTokenExpiresAt:
              Date.now() + (data.expires_in || 3600) * 1000,
          },
          { merge: true }
        );
    }

    return res.json(data);
  } catch (error) {
    console.error("Error refreshing token", error);
    return res.status(500).json({ error: "Failed to refresh token" });
  }
});

app.get("/api/profile", async (req, res) => {
  try {
    const userId = req.query.userId || "demo-user";
    const profileDoc = adminDb.collection("profiles").doc(userId.toString());
    const snapshot = await profileDoc.get();

    if (!snapshot.exists) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const data = snapshot.data();
    return res.json({
      id: snapshot.id,
      displayName: data?.displayName || "Username",
      bio: data?.bio || "",
      avatar: data?.avatar || null,
      isPublic: data?.isPublic ?? true,
      showArtists: data?.showArtists ?? true,
      showSongs: data?.showSongs ?? true,
      topArtists: data?.topArtists || [],
      topSongs: data?.topSongs || [],
    });
  } catch (error) {
    console.error("Error loading profile:", error);
    return res.status(500).json({ error: "Unable to load profile" });
  }
});

app.post("/api/profile", async (req, res) => {
  try {
    const userId = req.body.userId;
    const data = req.body.data;

    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!data || typeof data !== "object")
      return res.status(400).json({ error: "Missing data" });

    const allowed = [
      "displayName",
      "bio",
      "isPublic",
      "showArtists",
      "showSongs",
      "topArtists",
      "topSongs",
    ];

    const sanitized = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(data, key))
        sanitized[key] = data[key];
    }

    await adminDb
      .collection("profiles")
      .doc(userId.toString())
      .set(sanitized, { merge: true });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error saving profile:", err);
    return res.status(500).json({ error: "Failed to save profile" });
  }
});

// --- Liked Songs route ---
app.get("/api/liked-songs", async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];
  let tracks = [];
  let url = "https://api.spotify.com/v1/me/tracks?limit=50";
  while (url) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();
    tracks.push(...data.items);
    url = data.next;
  }
  res.json(tracks);
});

// --- Forum routes ---
app.get("/api/forums", async (req, res) => {
  const snapshot = await getDocs(collection(db, "forums"));
  const forums = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  res.json(forums);
});

app.post("/api/forums", async (req, res) => {
  const { name, description, createdBy } = req.body;
  const forum = {
    name,
    description,
    createdBy,
    postCount: 0,
    dateCreated: new Date(),
  };
  const ref = await addDoc(collection(db, "forums"), forum);
  res.json({ id: ref.id, ...forum });
});

app.get("/api/forums/:id/posts", async (req, res) => {
  const q = query(
    collection(db, "forumPosts"),
    where("forumId", "==", req.params.id),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  res.json(posts);
});

app.post("/api/forums/:id/posts", async (req, res) => {
  const { content, createdBy } = req.body;
  const post = {
    forumId: req.params.id,
    content,
    createdBy,
    likes: 0,
    likedBy: [],
    createdAt: new Date(),
  };
  const ref = await addDoc(collection(db, "forumPosts"), post);
  await updateDoc(doc(db, "forums", req.params.id), {
    postCount: increment(1),
  });
  res.json({ id: ref.id, ...post });
});

app.post("/api/posts/:id/like", async (req, res) => {
  const { userId } = req.body;
  const postRef = doc(db, "forumPosts", req.params.id);
  const postSnap = await getDoc(postRef);
  const likedBy = postSnap.data().likedBy || [];
  if (likedBy.includes(userId)) {
    await updateDoc(postRef, {
      likes: increment(-1),
      likedBy: arrayRemove(userId),
    });
  } else {
    await updateDoc(postRef, {
      likes: increment(1),
      likedBy: arrayUnion(userId),
    });
  }
  res.json({ success: true });
});

const usersRouter = require("./routes/users.js");

app.use("/users", usersRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});