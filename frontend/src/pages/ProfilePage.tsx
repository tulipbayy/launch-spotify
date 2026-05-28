import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './ProfilePage.css'

const fallbackArtists = [
  { name: 'Justin Bieber', subtitle: 'Pop' },
  { name: 'Dua Lipa', subtitle: 'Dance Pop' },
  { name: 'The Weeknd', subtitle: 'R&B' },
  { name: 'Olivia Rodrigo', subtitle: 'Alternative Pop' },
]

const fallbackSongs = [
  { name: 'Peaches', subtitle: 'Justin Bieber' },
  { name: 'Levitating', subtitle: 'Dua Lipa' },
  { name: 'Blinding Lights', subtitle: 'The Weeknd' },
  { name: 'Drivers License', subtitle: 'Olivia Rodrigo' },
]

const defaultProfile = {
  displayName: 'Username',
  bio:
    'A music-first social profile that blends your Spotify taste with a separate personal profile. Share your favorite artists, keep your top songs private, and connect with people who love the same sounds.',
  isPublic: true,
  showArtists: true,
  showSongs: true,
  topArtists: fallbackArtists,
  topSongs: fallbackSongs,
}

export default function ProfilePage() {
  const location = useLocation()
  const [profile, setProfile] = useState(defaultProfile)
  const [userId, setUserId] = useState('demo-user')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [draftDisplayName, setDraftDisplayName] = useState(defaultProfile.displayName)
  const [draftBio, setDraftBio] = useState(defaultProfile.bio)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const spotifyId = params.get('spotifyId')

    if (spotifyId) {
      localStorage.setItem('spotifyId', spotifyId)
      setUserId(spotifyId)
      window.history.replaceState(null, '', window.location.pathname)
      window.dispatchEvent(new Event('authChange'))
      return
    }

    const storedId = localStorage.getItem('spotifyId')
    if (storedId) {
      setUserId(storedId)
    }
  }, [location.search])

  useEffect(() => {
    async function loadProfile() {
      setError('')
      try {
        const response = await fetch(`http://localhost:5001/api/profile?userId=${encodeURIComponent(userId)}`)
        if (!response.ok) {
          throw new Error(`Unable to load profile: ${response.statusText}`)
        }

        const data = await response.json()
        const avatarValue = data.avatar || ''
        if (avatarValue) {
          localStorage.setItem('spotifyAvatar', avatarValue)
        } else {
          localStorage.removeItem('spotifyAvatar')
        }
        setProfile({
          displayName: data.displayName || defaultProfile.displayName,
          bio: data.bio || defaultProfile.bio,
          avatar: data.avatar || undefined,
          isPublic: data.isPublic ?? defaultProfile.isPublic,
          showArtists: data.showArtists ?? defaultProfile.showArtists,
          showSongs: data.showSongs ?? defaultProfile.showSongs,
          topArtists: data.topArtists?.length ? data.topArtists : defaultProfile.topArtists,
          topSongs: data.topSongs?.length ? data.topSongs : defaultProfile.topSongs,
        })
        setDraftDisplayName(data.displayName || defaultProfile.displayName)
        setDraftBio(data.bio || defaultProfile.bio)
        // clear any previous error now that load succeeded
        setError('')
        window.dispatchEvent(new Event('authChange'))
      } catch (fetchError) {
        console.error(fetchError)
        setError('Could not load profile data from Firebase. Showing fallback content.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [userId])

  // send partial updates to backend and optimistically update UI
  async function updateProfile(changes: Record<string, any>) {
    try {
      setProfile((p) => ({ ...p, ...changes }))
      const res = await fetch('http://localhost:5001/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data: changes }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Save failed')
      }
    } catch (e) {
      console.error('Failed saving profile changes', e)
      setError('Failed to save profile settings')
    }
  }

  function togglePublic() {
    updateProfile({ isPublic: !profile.isPublic })
  }

  function toggleArtists() {
    updateProfile({ showArtists: !profile.showArtists })
  }

  function toggleSongs() {
    updateProfile({ showSongs: !profile.showSongs })
  }

  function startEditing() {
    setDraftDisplayName(profile.displayName)
    setDraftBio(profile.bio)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
  }

  async function saveProfileEdits() {
    await updateProfile({ displayName: draftDisplayName, bio: draftBio })
    setEditing(false)
  }

  function handleLogout() {
    localStorage.removeItem('spotifyId')
    localStorage.removeItem('spotifyAvatar')
    setUserId('demo-user')
    setProfile(defaultProfile)
    setEditing(false)
    window.dispatchEvent(new Event('authChange'))
    window.location.href = '/profile'
  }

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-card">
          <div className="profile-status">
            Public Profile:
            <span>{profile.isPublic ? 'ON' : 'OFF'}</span>
          </div>

          {userId !== 'demo-user' && (
            <div className="profile-status" style={{ marginTop: '0.75rem' }}>
              Logged in as:
              <span>{profile.displayName}</span>
            </div>
          )}

          <div className="profile-main">
            <div className="profile-avatar" aria-hidden="true">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Profile avatar" />
              ) : (
                <span>{profile.displayName
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)}</span>
              )}
            </div>

            <div className="profile-details">
              <div className="profile-name-row">
                {editing ? (
                  <input
                    className="profile-name-input"
                    value={draftDisplayName}
                    onChange={(event) => setDraftDisplayName(event.target.value)}
                  />
                ) : (
                  <h1>{profile.displayName}</h1>
                )}
                <button
                  className="profile-edit"
                  type="button"
                  aria-label="Edit profile"
                  onClick={editing ? saveProfileEdits : startEditing}
                >
                  {editing ? 'Save' : '✎'}
                </button>
              </div>

              {editing ? (
                <textarea
                  className="profile-bio-input"
                  value={draftBio}
                  onChange={(event) => setDraftBio(event.target.value)}
                />
              ) : (
                <p className="profile-bio">{profile.bio}</p>
              )}
              {editing && (
                <button className="profile-cancel" type="button" onClick={cancelEditing}>
                  Cancel
                </button>
              )}

              <div className="profile-controls">
                <button className="profile-button" type="button" onClick={togglePublic}>
                  {profile.isPublic ? 'Make profile private' : 'Make profile public'}
                </button>
                {userId !== 'demo-user' ? (
                  <button className="profile-button" type="button" onClick={handleLogout}>
                    Logout
                  </button>
                ) : (
                  <a className="profile-button" href="http://localhost:5001/auth/login">
                    Login with Spotify
                  </a>
                )}
              </div>

              <div className="profile-toggles">
                <div className="profile-toggle-field">
                  <label>
                    <input type="checkbox" checked={profile.showArtists} onChange={toggleArtists} />
                    Display top artists on profile
                  </label>
                </div>
                <div className="profile-toggle-field">
                  <label>
                    <input type="checkbox" checked={profile.showSongs} onChange={toggleSongs} />
                    Display top songs on profile
                  </label>
                </div>
              </div>
            </div>
          </div>

          {loading && <p>Loading profile data...</p>}
          {error && profile.displayName === defaultProfile.displayName && (
            <p style={{ color: '#d43f00' }}>{error}</p>
          )}
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-header">
          <span>Top Artists: {profile.showArtists ? 'Visible' : 'Hidden'}</span>
          <small>{profile.showArtists ? 'Visible on profile' : 'Not displayed'}</small>
        </div>

        {profile.showArtists ? (
          <div className="cards-grid">
            {profile.topArtists.map((artist) => (
              <article className="content-card" key={artist.name}>
                <img
                  src={artist.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=640&q=80'}
                  alt={artist.name}
                />
                <div className="card-body">
                  <h2 className="card-title">{artist.name}</h2>
                  <p className="card-subtitle">{artist.subtitle}</p>
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
          <span>Top Songs: {profile.showSongs ? 'Visible' : 'Hidden'}</span>
          <small>{profile.showSongs ? 'Visible on profile' : 'Not displayed'}</small>
        </div>

        {profile.showSongs ? (
          <div className="cards-grid">
            {profile.topSongs.map((song) => (
              <article className="content-card" key={song.name}>
                <img
                  src={song.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=640&q=80'}
                  alt={song.name}
                />
                <div className="card-body">
                  <h2 className="card-title">{song.name}</h2>
                  <p className="card-subtitle">{song.subtitle}</p>
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
