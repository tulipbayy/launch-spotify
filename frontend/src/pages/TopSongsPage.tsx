import { useEffect, useState } from 'react'
import { spotify, ApiError, type Track, type RangeKey } from '../lib/api'

// TEMPORARY data-dump page (no CSS) with a range filter.
const RANGES: RangeKey[] = ['all_time', 'six_months', 'one_month']

export default function TopSongsPage() {
  const [range, setRange] = useState<RangeKey>('all_time')
  const [items, setItems] = useState<Track[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    spotify
      .topTracks(range)
      .then((r) => setItems(r.items))
      .catch((e) =>
        setError(e instanceof ApiError ? `${e.status} ${e.message} (${e.code})` : String(e))
      )
      .finally(() => setLoading(false))
  }, [range])

  return (
    <div>
      <h2>Top Songs ({range})</h2>
      <div>
        {RANGES.map((r) => (
          <button key={r} onClick={() => setRange(r)} disabled={r === range} style={{ marginRight: 8 }}>
            {r}
          </button>
        ))}
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <ol>
        {items.map((t) => (
          <li key={t.id}>
            {t.name} — {t.artists.join(', ')} ({t.album.name})
          </li>
        ))}
      </ol>
    </div>
  )
}
