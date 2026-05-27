import { useEffect, useState } from 'react'
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
  const [profile, setProfile] = useState(defaultProfile)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('http://localhost:5001/api/profile?userId=demo-user')
        if (!response.ok) {
          throw new Error(`Unable to load profile: ${response.statusText}`)
        }

        const data = await response.json()
        setProfile({
          displayName: data.displayName || defaultProfile.displayName,
          bio: data.bio || defaultProfile.bio,
          isPublic: data.isPublic ?? defaultProfile.isPublic,
          showArtists: data.showArtists ?? defaultProfile.showArtists,
          showSongs: data.showSongs ?? defaultProfile.showSongs,
          topArtists: data.topArtists?.length ? data.topArtists : defaultProfile.topArtists,
          topSongs: data.topSongs?.length ? data.topSongs : defaultProfile.topSongs,
        })
      } catch (fetchError) {
        console.error(fetchError)
        setError('Could not load profile data from Firebase. Showing fallback content.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-card">
          <div className="profile-status">
            Public Profile:
            <span>{profile.isPublic ? 'ON' : 'OFF'}</span>
          </div>

          <div className="profile-main">
            <div className="profile-avatar" aria-hidden="true">
              <span>{profile.displayName
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)}</span>
            </div>

            <div className="profile-details">
              <div className="profile-name-row">
                <h1>{profile.displayName}</h1>
                <button className="profile-edit" type="button" aria-label="Edit profile">
                  ✎
                </button>
              </div>

              <p className="profile-bio">{profile.bio}</p>

              <div className="profile-controls">
                <button className="profile-button" type="button">
                  {profile.isPublic ? 'Make profile private' : 'Make profile public'}
                </button>
                <button className="profile-toggle" type="button">
                  Manage profile visibility
                </button>
              </div>

              <div className="profile-toggles">
                <div className="profile-toggle-field">
                  <label>
                    <input type="checkbox" checked={profile.showArtists} readOnly />
                    Display top artists on profile
                  </label>
                </div>
                <div className="profile-toggle-field">
                  <label>
                    <input type="checkbox" checked={profile.showSongs} readOnly />
                    Display top songs on profile
                  </label>
                </div>
              </div>
            </div>
          </div>

          {loading && <p>Loading profile data...</p>}
          {error && <p style={{ color: '#d43f00' }}>{error}</p>}
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-header">
          <span>Top Artists: {profile.showArtists ? 'Public' : 'Hidden'}</span>
          <small>{profile.showArtists ? 'Shared with discover' : 'Visible only to you'}</small>
        </div>

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
      </section>

      <section className="profile-section">
        <div className="profile-section-header">
          <span>Top Songs: {profile.showSongs ? 'Private' : 'Hidden'}</span>
          <small>{profile.showSongs ? 'Only visible on your personal profile' : 'Not displayed'}</small>
        </div>

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
      </section>
    </div>
  )
}
