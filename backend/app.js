require("dotenv").config();
const express = require("express");
const cors = require("cors");
const adminDb = require("./firebaseAdmin");
const {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} = require("firebase/firestore");
const db = require("./firebase");
const messagesRouter = require("./routes/messages");

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());
app.use("/api/messages", messagesRouter);

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
          isPublic: existingData?.isPublic ?? true,
        },
        { merge: true }
      );
    } catch (e) {
      console.error("Failed saving tokens to Firestore", e);
    }

    return res.redirect(
      `${FRONTEND_URL}/profile?spotifyId=${encodeURIComponent(
        spotifyId
      )}&accessToken=${tokenData.access_token}`
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
  try {
    const snapshot = await getDocs(collection(db, "forums"));
    const forums = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(forums);
  } catch (err) {
    console.error("Failed to fetch forums:", err);
    res.status(500).json({ error: "Failed to fetch forums" });
  }
});

// FIX: was using "name" — frontend sends "title"
app.post("/api/forums", async (req, res) => {
  try {
    const { title, description, createdBy } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });
    const forum = {
      title,
      description: description || "",
      createdBy: createdBy || "",
      postCount: 0,
      createdAt: new Date(),
    };
    const ref = await addDoc(collection(db, "forums"), forum);
    res.json({ id: ref.id, ...forum });
  } catch (err) {
    console.error("Failed to create forum:", err);
    res.status(500).json({ error: "Failed to create forum" });
  }
});

app.get("/api/forums/:id/posts", async (req, res) => {
  try {
    const q = query(
      collection(db, "forumPosts"),
      where("forumId", "==", req.params.id),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    // Normalise: return "likes" as an array (likedBy) so frontend can do .includes()
    const posts = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        // frontend expects post.likes to be an array of userIds
        likes: data.likedBy || [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
      };
    });
    res.json(posts);
  } catch (err) {
    console.error("Failed to fetch posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// FIX: was using "content" — frontend sends "text"; now also saves musicTag
app.post("/api/forums/:id/posts", async (req, res) => {
  try {
    const { text, createdBy, musicTag } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    const post = {
      forumId: req.params.id,
      text,
      createdBy: createdBy || "",
      likes: 0,
      likedBy: [],
      createdAt: new Date(),
      // only include musicTag if one was provided
      ...(musicTag ? { musicTag } : {}),
    };

    const ref = await addDoc(collection(db, "forumPosts"), post);
    await updateDoc(doc(db, "forums", req.params.id), {
      postCount: increment(1),
    });

    // Return with likes as array so frontend stays consistent
    res.json({ id: ref.id, ...post, likes: [] });
  } catch (err) {
    console.error("Failed to create post:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// GET a single forum by id (used by ForumDetailPage header)
app.get("/api/forums/:id", async (req, res) => {
  try {
    const snap = await getDoc(doc(db, "forums", req.params.id));
    if (!snap.exists())
      return res.status(404).json({ error: "Forum not found" });
    res.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error("Failed to fetch forum:", err);
    res.status(500).json({ error: "Failed to fetch forum" });
  }
});

app.post("/api/posts/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const postRef = doc(db, "forumPosts", req.params.id);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists())
      return res.status(404).json({ error: "Post not found" });

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
  } catch (err) {
    console.error("Failed to like post:", err);
    res.status(500).json({ error: "Failed to like post" });
  }
});

// --- Edit forum ---
app.patch("/api/forums/:id", async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });
    await updateDoc(doc(db, "forums", req.params.id), {
      title,
      description: description ?? "",
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to edit forum:", err);
    res.status(500).json({ error: "Failed to edit forum" });
  }
});

// --- Delete forum (and all its posts) ---
app.delete("/api/forums/:id", async (req, res) => {
  try {
    // Delete all posts in the forum first
    const q = query(
      collection(db, "forumPosts"),
      where("forumId", "==", req.params.id)
    );
    const snapshot = await getDocs(q);
    const deletes = snapshot.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletes);
    // Delete the forum doc
    await deleteDoc(doc(db, "forums", req.params.id));
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete forum:", err);
    res.status(500).json({ error: "Failed to delete forum" });
  }
});

// --- Edit post ---
app.patch("/api/posts/:id", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });
    await updateDoc(doc(db, "forumPosts", req.params.id), { text });
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to edit post:", err);
    res.status(500).json({ error: "Failed to edit post" });
  }
});

// --- Delete post ---
app.delete("/api/posts/:id", async (req, res) => {
  try {
    const postSnap = await getDoc(doc(db, "forumPosts", req.params.id));
    if (!postSnap.exists())
      return res.status(404).json({ error: "Post not found" });
    const { forumId } = postSnap.data();
    await deleteDoc(doc(db, "forumPosts", req.params.id));
    // Decrement forum post count
    await updateDoc(doc(db, "forums", forumId), { postCount: increment(-1) });
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete post:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// --- Spotify music search (for forum post tagging) ---
app.get("/api/spotify/search", async (req, res) => {
  const { q, type = "track,artist,album" } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    const params = new URLSearchParams({ q: q.trim(), type, limit: "6" });
    const response = await fetch(
      `https://api.spotify.com/v1/search?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const results = [];

    if (data.tracks?.items) {
      data.tracks.items.forEach((t) => {
        results.push({
          type: "track",
          id: t.id,
          name: t.name,
          subtitle: t.artists.map((a) => a.name).join(", "),
          image: t.album.images?.[1]?.url ?? t.album.images?.[0]?.url ?? null,
          spotifyUrl: t.external_urls.spotify,
        });
      });
    }

    if (data.artists?.items) {
      data.artists.items.forEach((a) => {
        results.push({
          type: "artist",
          id: a.id,
          name: a.name,
          subtitle: "Artist",
          image: a.images?.[1]?.url ?? a.images?.[0]?.url ?? null,
          spotifyUrl: a.external_urls.spotify,
        });
      });
    }

    if (data.albums?.items) {
      data.albums.items.forEach((al) => {
        results.push({
          type: "album",
          id: al.id,
          name: al.name,
          subtitle: al.artists.map((a) => a.name).join(", "),
          image: al.images?.[1]?.url ?? al.images?.[0]?.url ?? null,
          spotifyUrl: al.external_urls.spotify,
        });
      });
    }

    res.json(results);
  } catch (err) {
    console.error("Spotify search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- Batch fetch display names by userId array ---
// POST /api/profiles/batch  { userIds: ["id1","id2",...] }
app.post("/api/profiles/batch", async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) return res.json({});

    const unique = [...new Set(userIds)].slice(0, 30); // cap at 30
    const snaps = await Promise.all(
      unique.map((uid) => adminDb.collection("profiles").doc(uid).get())
    );

    const result = {};
    snaps.forEach((snap, i) => {
      result[unique[i]] = snap.exists
        ? snap.data()?.displayName || unique[i]
        : unique[i];
    });
    res.json(result);
  } catch (err) {
    console.error("Batch profile fetch error:", err);
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

// --- Replies ---

// GET replies for a post
app.get("/api/posts/:id/replies", async (req, res) => {
  try {
    const q = query(
      collection(db, "forumPosts", req.params.id, "replies"),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    const replies = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt:
        d.data().createdAt?.toDate?.()?.toISOString() ?? d.data().createdAt,
    }));
    res.json(replies);
  } catch (err) {
    console.error("Failed to fetch replies:", err);
    res.status(500).json({ error: "Failed to fetch replies" });
  }
});

// POST a reply to a post
app.post("/api/posts/:id/replies", async (req, res) => {
  try {
    const { text, createdBy } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });
    const reply = {
      text,
      createdBy: createdBy || "",
      createdAt: new Date(),
    };
    const ref = await addDoc(
      collection(db, "forumPosts", req.params.id, "replies"),
      reply
    );
    res.json({
      id: ref.id,
      ...reply,
      createdAt: reply.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Failed to post reply:", err);
    res.status(500).json({ error: "Failed to post reply" });
  }
});

// DELETE a reply
app.delete("/api/posts/:postId/replies/:replyId", async (req, res) => {
  try {
    await deleteDoc(
      doc(db, "forumPosts", req.params.postId, "replies", req.params.replyId)
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete reply:", err);
    res.status(500).json({ error: "Failed to delete reply" });
  }
});

const usersRouter = require("./routes/users.js");
app.use("/users", usersRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
