import { useEffect, useState } from 'react'
import { spotify, ApiError, type Artist, type RangeKey } from '../lib/api'

// TEMPORARY data-dump page (no CSS) with a range filter.
const RANGES: RangeKey[] = ['all_time', 'six_months', 'one_month']

export default function TopArtistsPage() {
  const [range, setRange] = useState<RangeKey>('all_time')
  const [items, setItems] = useState<Artist[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    spotify
      .topArtists(range)
      .then((r) => setItems(r.items))
      .catch((e) =>
        setError(e instanceof ApiError ? `${e.status} ${e.message} (${e.code})` : String(e))
      )
      .finally(() => setLoading(false))
  }, [range])

  return (
    <div>
      <h2>Top Artists ({range})</h2>
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
        {items.map((a) => (
          <li key={a.id}>
            {a.name} {a.genres.length ? `[${a.genres.join(', ')}]` : ''}
          </li>
        ))}
      </ol>
    </div>
  )
}
