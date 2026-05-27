import { useEffect, useState } from 'react'
import {
  discover,
  ApiError,
  type PublicUser,
  type Artist,
  type Track,
} from '../lib/api'

// TEMPORARY data-dump page (no CSS). Lists public users; click one to view it.
export default function DiscoverPage() {
  const [users, setUsers] = useState<PublicUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<{
    user: PublicUser
    displayedArtists: Artist[]
    displayedSongs: Track[]
  } | null>(null)

  const fail = (e: unknown) =>
    setError(e instanceof ApiError ? `${e.status} ${e.message} (${e.code})` : String(e))

  useEffect(() => {
    discover
      .list()
      .then((r) => setUsers(r.users))
      .catch(fail)
      .finally(() => setLoading(false))
  }, [])

  const view = (id: string) => {
    setError(null)
    discover.getOne(id).then(setSelected).catch(fail)
  }

  return (
    <div>
      <h2>Discover (public users)</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && users.length === 0 && <p>No public users yet.</p>}
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.profile?.displayName || u.spotifyProfile?.displayName} ({u.id}){' '}
            <button onClick={() => view(u.id)}>View</button>
          </li>
        ))}
      </ul>

      {selected && (
        <div>
          <h3>Viewing: {selected.user.profile?.displayName || selected.user.id}</h3>
          <pre>{JSON.stringify(selected.user, null, 2)}</pre>
          <h4>Displayed Artists</h4>
          <ol>
            {selected.displayedArtists.map((a) => (
              <li key={a.id}>{a.name}</li>
            ))}
          </ol>
          <h4>Displayed Songs</h4>
          <ol>
            {selected.displayedSongs.map((t) => (
              <li key={t.id}>
                {t.name} — {t.artists.join(', ')}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
