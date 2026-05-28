import { useEffect, useState } from 'react'
import {
  profile,
  spotify,
  auth,
  ApiError,
  type SelfUser,
  type Artist,
  type Track,
} from '../lib/api'
import './ProfilePage.css'

// Profile via the modular backend (lib/api, cookie session).
// Visibility uses `isPrivate`; top artists/songs are fetched live from Spotify.
export default function ProfilePage() {
  const [user, setUser] = useState<SelfUser | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [songs, setSongs] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftBio, setDraftBio] = useState('')
  const [showArtists, setShowArtists] = useState(true)
  const [showSongs, setShowSongs] = useState(true)

  const fail = (e: unknown) =>
    setError(e instanceof ApiError ? `${e.status} ${e.message} (${e.code})` : String(e))

  useEffect(() => {
    profile
      .get()
      .then((r) => {
        setUser(r.user)
        setDraftName(r.user.displayName || '')
        setDraftBio(r.user.bio || '')
      })
      .catch(fail)
      .finally(() => setLoading(false))
    spotify.topArtists('all_time').then((r) => setArtists(r.items)).catch(() => {})
    spotify.topTracks('all_time').then((r) => setSongs(r.items)).catch(() => {})
  }, [])

  const saveEdits = () => {
    profile
      .update({ displayName: draftName, bio: draftBio })
      .then((r) => {
        setUser(r.user)
        setEditing(false)
      })
      .catch(fail)
  }

  const toggleVisibility = () => {
    if (!user) return
    profile
      .setVisibility(!user.isPrivate)
      .then((r) => setUser(r.user))
      .catch(fail)
  }

  const logout = () => {
    auth.logout().then(() => {
      window.location.href = '/profile'
    })
  }

  if (loading) return <div className="profile-page"><p>Loading profile...</p></div>
  if (!user) {
    return (
      <div className="profile-page">
        {error && <p style={{ color: '#d43f00' }}>{error}</p>}
        <a className="profile-button" href="/auth/login">Login with Spotify</a>
      </div>
    )
  }

  const displayName = user.displayName || 'Username'
  const avatar = user.pfp

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-card">
          <div className="profile-status">
            Public Profile:
            <span>{user.isPrivate ? 'OFF' : 'ON'}</span>
          </div>

          <div className="profile-main">
            <div className="profile-avatar" aria-hidden="true">
              {avatar ? (
                <img src={avatar} alt="Profile avatar" />
              ) : (
                <span>{displayName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
              )}
            </div>

            <div className="profile-details">
              <div className="profile-name-row">
                {editing ? (
                  <input
                    className="profile-name-input"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                  />
                ) : (
                  <h1>{displayName}</h1>
                )}
                <button
                  className="profile-edit"
                  type="button"
                  onClick={editing ? saveEdits : () => setEditing(true)}
                >
                  {editing ? 'Save' : '✎'}
                </button>
              </div>

              {editing ? (
                <textarea
                  className="profile-bio-input"
                  value={draftBio}
                  onChange={(e) => setDraftBio(e.target.value)}
                />
              ) : (
                <p className="profile-bio">{user.bio}</p>
              )}

              <div className="profile-controls">
                <button className="profile-button" type="button" onClick={toggleVisibility}>
                  {user.isPrivate ? 'Make profile public' : 'Make profile private'}
                </button>
                <button className="profile-button" type="button" onClick={logout}>
                  Logout
                </button>
              </div>

              <div className="profile-toggles">
                <div className="profile-toggle-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={showArtists}
                      onChange={() => setShowArtists((v) => !v)}
                    />
                    Display top artists on profile
                  </label>
                </div>
                <div className="profile-toggle-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={showSongs}
                      onChange={() => setShowSongs((v) => !v)}
                    />
                    Display top songs on profile
                  </label>
                </div>
              </div>
            </div>
          </div>

          {error && <p style={{ color: '#d43f00' }}>{error}</p>}
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-header">
          <span>Top Artists: {showArtists ? 'Visible' : 'Hidden'}</span>
        </div>
        {showArtists ? (
          <div className="cards-grid">
            {artists.map((a) => (
              <article className="content-card" key={a.id}>
                {a.images[0]?.url && <img src={a.images[0].url} alt={a.name} />}
                <div className="card-body">
                  <h2 className="card-title">{a.name}</h2>
                  {a.genres[0] && <p className="card-subtitle">{a.genres[0]}</p>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="profile-hidden-note">Top artists are hidden from your profile.</div>
        )}
      </section>

      <section className="profile-section">
        <div className="profile-section-header">
          <span>Top Songs: {showSongs ? 'Visible' : 'Hidden'}</span>
        </div>
        {showSongs ? (
          <div className="cards-grid">
            {songs.map((t) => (
              <article className="content-card" key={t.id}>
                {t.album.images[0]?.url && <img src={t.album.images[0].url} alt={t.name} />}
                <div className="card-body">
                  <h2 className="card-title">{t.name}</h2>
                  <p className="card-subtitle">{t.artists.join(', ')}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="profile-hidden-note">Top songs are hidden from your profile.</div>
        )}
      </section>
    </div>
  )
}
