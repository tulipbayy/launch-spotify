import { useState, useEffect } from "react";
import "./LikedSongsPage.css";

export default function LikedSongsPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [accessToken, setAccessToken] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (token) setAccessToken(token);
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    const fetchTracks = async () => {
      setLoading(true);
      const response = await fetch("http://127.0.0.1:3001/api/liked-songs", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      setTracks(data);
      setLoading(false);
    };

    fetchTracks();
  }, [accessToken]);

  const formatDuration = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="liked-page">
      <div className="liked-header">
        <h1 className="liked-title">Liked songs</h1>
        {!loading && <p className="liked-subtitle">{tracks.length} songs</p>}
      </div>

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
            <div key={item.track.id} className="track-row">
              <span className="track-index">{index + 1}</span>
              <img
                src={item.track.album.images[0]?.url}
                alt={item.track.album.name}
                className="track-album-art"
              />
              <div className="track-info">
                <p className="track-name">{item.track.name}</p>
                <p className="track-artist">
                  {item.track.artists.map((a: any) => a.name).join(", ")}
                </p>
              </div>
              <span className="track-duration">
                {formatDuration(item.track.duration_ms)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
