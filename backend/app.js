require("dotenv").config();
const express = require("express");
const cors = require("cors");
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
} = require("firebase/firestore");
const db = require("./firebase");
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get("/auth/login", (req, res) => {
  const scopes = [
    "user-library-read",
    "user-top-read",
    "user-read-private",
    "user-read-email",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: scopes,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    }),
  });

  const data = await response.json();

  const profileRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const profile = await profileRes.json();

  res.redirect(
    `http://localhost:5173?accessToken=${data.access_token}&userId=${profile.id}`
  );
});

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
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
