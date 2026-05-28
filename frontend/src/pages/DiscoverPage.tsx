import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { discover, type PublicUser, type Artist, type Track } from '../lib/api'
import '../styles/DiscoverPage.css'

const BRAND_COLORS = ['#1b3b5a', '#fbbd5c', '#da3b3a', '#f17f16', '#8fa0a8']

interface CardUser extends PublicUser {
  color: string
}

interface SelectedDetail {
  user: PublicUser
  topArtist: Artist | null
  topSong: Track | null
}

export default function DiscoverPage() {
  const [users, setUsers] = useState<CardUser[]>([])
  const [selected, setSelected] = useState<SelectedDetail | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    discover
      .list()
      .then((r) => {
        setUsers(
          r.users.map((u, i) => ({ ...u, color: BRAND_COLORS[i % BRAND_COLORS.length] }))
        )
      })
      .catch((e) => console.error('failed to get users:', e))
  }, [])

  // Load a user's hydrated top artist/song for the modal.
  const openUser = (user: PublicUser) => {
    setSelected({ user, topArtist: null, topSong: null })
    discover
      .getOne(user.id)
      .then((r) =>
        setSelected({
          user: r.user,
          topArtist: r.displayedArtists[0] || null,
          topSong: r.displayedSongs[0] || null,
        })
      )
      .catch((e) => console.error('failed to load user:', e))
  }

  if (users.length === 0) {
    return (
      <div className="discover-container">
        <h2>Loading users...</h2>
      </div>
    )
  }

  const featuredUser = users[0]
  const moreUsers = users.slice(1)

  return (
    <div className="discover-container">
      <h2>Discover users</h2>

      <div className="featured-section">
        <div
          className="featured-avatar-block clickable"
          style={{ backgroundColor: featuredUser.color }}
          onClick={() => openUser(featuredUser)}
        >
          <div className="avatar-circle"></div>
        </div>

        <div className="featured-info">
          <h3>Your Top User</h3>
          <p className="username-text">{featuredUser.displayName}</p>
          <div className="action-buttons">
            <button onClick={() => navigate(`/inbox?userId=${featuredUser.id}`)}>✉️ Message</button>
          </div>
        </div>
      </div>

      <hr className="divider" />

      <div className="more-users-section">
        <div className="more-users-header">
          <h3>More Users</h3>
        </div>

        <div className="users-grid">
          {moreUsers.map((user) => (
            <div key={user.id} className="small-user-card">
              <div
                className="small-avatar-block clickable"
                style={{ backgroundColor: user.color }}
                onClick={() => openUser(user)}
              >
                <div className="avatar-circle"></div>
              </div>

              <p className="username-text">{user.displayName}</p>

              <div className="action-buttons small">
                <button onClick={() => navigate(`/inbox?userId=${user.id}`)}>✉️ Message</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelected(null)}>
              ⊗
            </button>

            <div className="modal-header">
              <div className="modal-avatar"></div>
              <div className="modal-title">
                <h2>{selected.user.displayName}</h2>
                <p>{selected.user.bio}</p>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-music">
                <div className="music-item">
                  <span className="music-label">Top Artist</span>
                  {selected.topArtist ? (
                    <>
                      <img
                        src={selected.topArtist.images[0]?.url}
                        alt={selected.topArtist.name}
                      />
                      <p>{selected.topArtist.name}</p>
                    </>
                  ) : (
                    <p>—</p>
                  )}
                </div>

                <div className="music-item">
                  <span className="music-label">Top Song</span>
                  {selected.topSong ? (
                    <>
                      <img
                        src={selected.topSong.album.images[0]?.url}
                        alt={selected.topSong.name}
                      />
                      <p>{selected.topSong.name}</p>
                    </>
                  ) : (
                    <p>—</p>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={() => navigate(`/inbox?userId=${selected.user.id}`)}>
                  ✉️ Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
