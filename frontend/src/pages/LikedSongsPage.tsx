import { useState, useEffect } from 'react'
import { spotify, ApiError, type Track } from '../lib/api'
import './LikedSongsPage.css'

export default function LikedSongsPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    spotify
      .liked(50, 0)
      .then((r) => setTracks(r.items))
      .catch((e) =>
        setError(e instanceof ApiError ? `${e.status} ${e.message} (${e.code})` : String(e))
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="liked-page">
      <div className="liked-header">
        <h1 className="liked-title">Liked songs</h1>
        {!loading && !error && <p className="liked-subtitle">{tracks.length} songs</p>}
      </div>

      {error && <p style={{ color: '#ff6b6b' }}>Error: {error}</p>}

      {loading ? (
        <div className="skeleton-list">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton-box" style={{ height: '16px', animationDelay: `${i * 0.05}s` }} />
              <div
                className="skeleton-box"
                style={{ width: '56px', height: '56px', animationDelay: `${i * 0.05}s` }}
              />
              <div className="skeleton-info">
                <div
                  className="skeleton-box"
                  style={{ height: '14px', width: '40%', animationDelay: `${i * 0.05}s` }}
                />
                <div
                  className="skeleton-box"
                  style={{ height: '12px', width: '25%', animationDelay: `${i * 0.05}s` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="liked-list">
          {tracks.map((track, index) => (
            <div key={track.id} className="track-row">
              <span className="track-index">{index + 1}</span>
              <img
                src={track.album.images[0]?.url}
                alt={track.album.name}
                className="track-album-art"
              />
              <div className="track-info">
                <p className="track-name">{track.name}</p>
                <p className="track-artist">{track.artists.join(', ')}</p>
              </div>
              {track.externalUrl && (
                <a
                  className="track-duration"
                  href={track.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  ▶
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
