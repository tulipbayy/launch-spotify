import { useState, useEffect } from "react";
import "./LikedSongsPage.css";

interface Track {
  id: string;
  name: string;
  duration_ms: number;
  artists: string[];
  album: {
    name: string;
    images: { url: string }[];
  };
  externalUrl: string | null;
  previewUrl: string | null;
  addedAt: string;
}

export default function LikedSongsPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [accessToken, setAccessToken] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (token) setAccessToken(token);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const fetchTracks = async () => {
      setLoading(true);
      const response = await fetch("/api/spotify/liked", {
        credentials: 'include',
      });
      const data = await response.json();
      setTracks(data.items || []);
      setLoading(false);
    };
    fetchTracks();
  }, [accessToken]);

  const formatDuration = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="liked-page">
      <div className="liked-header">
        <h1 className="liked-title">Liked Songs</h1>
        {!loading && <p className="liked-subtitle">{tracks.length} songs</p>}
      </div>

      {selectedTrack && (
        <div className="selected-panel">
          <img
            src={selectedTrack.album.images[0]?.url}
            alt={selectedTrack.album.name}
            className="selected-art"
          />
          <div className="selected-info">
            <p className="selected-name">{selectedTrack.name}</p>
            <p className="selected-artist">
              {selectedTrack.artists.join(", ")}
            </p>
            <p className="selected-album">{selectedTrack.album.name}</p>
            <p className="selected-meta">
              Added {formatDate(selectedTrack.addedAt)} &middot;{" "}
              {formatDuration(selectedTrack.duration_ms)}
            </p>
          </div>
          <div className="selected-actions">
            <a
              href={selectedTrack.externalUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-spotify"
            >
              Play on Spotify
            </a>
            <button
              className="btn-close"
              onClick={() => setSelectedTrack(null)}
            >
              &#x2715;
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="skeleton-list">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton-row">
              <div
                className="skeleton-box"
                style={{ height: "16px", animationDelay: `${i * 0.05}s` }}
              />
              <div
                className="skeleton-box"
                style={{
                  width: "56px",
                  height: "56px",
                  animationDelay: `${i * 0.05}s`,
                }}
              />
              <div className="skeleton-info">
                <div
                  className="skeleton-box"
                  style={{
                    height: "14px",
                    width: "40%",
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
                <div
                  className="skeleton-box"
                  style={{
                    height: "12px",
                    width: "25%",
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              </div>
              <div
                className="skeleton-box"
                style={{
                  height: "12px",
                  width: "32px",
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="liked-list">
          {tracks.map((item, index) => (
            <div
              key={item.id}
              className={`track-row ${
                selectedTrack?.id === item.id ? "active" : ""
              }`}
              onClick={() =>
                setSelectedTrack(
                  selectedTrack?.id === item.id ? null : item
                )
              }
            >
              <span className="track-index">{index + 1}</span>
              <img
                src={item.album.images[0]?.url}
                alt={item.album.name}
                className="track-album-art"
              />
              <div className="track-info">
                <p className="track-name">{item.name}</p>
                <p className="track-artist">
                  {item.artists.join(", ")}
                </p>
              </div>
              <span className="track-duration">
                {formatDuration(item.duration_ms)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
