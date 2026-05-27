import { useEffect, useState } from 'react'
import {
  auth,
  spotify,
  ApiError,
  type SelfUser,
  type Artist,
  type Track,
  type RangeKey,
} from '../lib/api'

// TEMPORARY backend-testing page. Dumps everything the backend returns in a
// readable form, no styling. Replace with the real Home page later.

const RANGES: RangeKey[] = ['all_time', 'six_months', 'one_month']

export default function HomePage() {
  const [user, setUser] = useState<SelfUser | null>(null)
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [spotifyMe, setSpotifyMe] = useState<unknown>(null)
  const [range, setRange] = useState<RangeKey>('all_time')
  const [artists, setArtists] = useState<Artist[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [liked, setLiked] = useState<Track[]>([])
  const [error, setError] = useState<string | null>(null)

  // Check session on mount.
  useEffect(() => {
    auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCheckedAuth(true))
  }, [])

  // Load all backend data once logged in (and when range changes).
  useEffect(() => {
    if (!user) return
    setError(null)
    Promise.all([
      spotify.me(),
      spotify.topArtists(range),
      spotify.topTracks(range),
      spotify.liked(50, 0),
    ])
      .then(([me, a, t, l]) => {
        setSpotifyMe(me.profile)
        setArtists(a.items)
        setTracks(t.items)
        setLiked(l.items)
      })
      .catch((e) =>
        setError(e instanceof ApiError ? `${e.status} ${e.message} (${e.code})` : String(e))
      )
  }, [user, range])

  if (!checkedAuth) return <p>Checking session...</p>

  if (!user) {
    return (
      <div>
        <p>Not logged in.</p>
        <button onClick={() => auth.login()}>Sign in with Spotify</button>
      </div>
    )
  }

  return (
    <div>
      <h2>Backend data dump (temporary)</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <h3>/auth/me (app profile)</h3>
      <pre>{JSON.stringify(user, null, 2)}</pre>

      <h3>/api/spotify/me (raw Spotify profile)</h3>
      <pre>{JSON.stringify(spotifyMe, null, 2)}</pre>

      <h3>Range</h3>
      <div>
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            disabled={r === range}
            style={{ marginRight: 8 }}
          >
            {r}
          </button>
        ))}
      </div>

      <h3>Top Artists ({range}) — {artists.length}</h3>
      <ol>
        {artists.map((a) => (
          <li key={a.id}>
            {a.name} {a.genres.length ? `[${a.genres.join(', ')}]` : ''}
          </li>
        ))}
      </ol>

      <h3>Top Songs ({range}) — {tracks.length}</h3>
      <ol>
        {tracks.map((t) => (
          <li key={t.id}>
            {t.name} — {t.artists.join(', ')} ({t.album.name})
          </li>
        ))}
      </ol>

      <h3>Liked Songs — {liked.length}</h3>
      <ol>
        {liked.map((t) => (
          <li key={t.id}>
            {t.name} — {t.artists.join(', ')} ({t.album.name})
          </li>
        ))}
      </ol>
    </div>
  )
}
