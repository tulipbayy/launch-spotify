import { useEffect, useState } from 'react'
import { spotify, ApiError, type Track } from '../lib/api'

// TEMPORARY data-dump page (no CSS). Liked/saved tracks have no range filter.
export default function LikedSongsPage() {
  const [items, setItems] = useState<Track[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    spotify
      .liked(50, 0)
      .then((r) => {
        setItems(r.items)
        setTotal(r.total)
      })
      .catch((e) =>
        setError(e instanceof ApiError ? `${e.status} ${e.message} (${e.code})` : String(e))
      )
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading liked songs...</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

  return (
    <div>
      <h2>Liked Songs (showing {items.length} of {total})</h2>
      <ol>
        {items.map((t) => (
          <li key={t.id}>
            {t.name} — {t.artists.join(', ')} ({t.album.name})
            {t.addedAt ? ` · added ${new Date(t.addedAt).toLocaleDateString()}` : ''}
          </li>
        ))}
      </ol>
    </div>
  )
}
