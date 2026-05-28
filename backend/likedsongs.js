require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = 3001;

app.use(cors({ origin: "http://localhost:5173" }));
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
  res.redirect(`http://localhost:5173?accessToken=${data.access_token}`);
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
