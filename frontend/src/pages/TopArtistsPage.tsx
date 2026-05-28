import { useEffect, useState } from 'react'
import { Card, Avatar, Button, Menu } from '@mantine/core'
import { spotify, ApiError, type Artist, type RangeKey } from '../lib/api'
import './TopArtistsPage.css'

const FILTERS: { label: string; range: RangeKey }[] = [
  { label: 'All Time', range: 'all_time' },
  { label: 'Last 6 Months', range: 'six_months' },
  { label: 'Last Month', range: 'one_month' },
]

function ArtistCard({ rank, artist }: { rank: number; artist: Artist }) {
  return (
    <Card className="artist-card" radius="lg" padding={0}>
      <div className="artist-card-content">
        <span className="artist-rank">#{rank}</span>
        <Avatar className="artist-avatar" radius="50%" src={artist.images[0]?.url} />
        <span className="artist-name">{artist.name}</span>
      </div>
    </Card>
  )
}

export default function TopArtistsPage() {
  const [filter, setFilter] = useState(FILTERS[0])
  const [artists, setArtists] = useState<Artist[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    spotify
      .topArtists(filter.range)
      .then((r) => setArtists(r.items))
      .catch((e) =>
        setError(e instanceof ApiError ? `${e.status} ${e.message} (${e.code})` : String(e))
      )
  }, [filter])

  return (
    <div className="top-artists-page">
      <div className="top-artists-header">
        <h1 className="top-artists-title">Top Artists</h1>
        <Menu position="bottom-end" radius="md">
          <Menu.Target>
            <Button className="top-artists-filter">{filter.label} ▾</Button>
          </Menu.Target>
          <Menu.Dropdown className="top-artists-filter-menu">
            {FILTERS.map((f) => (
              <Menu.Item
                key={f.range}
                onClick={() => setFilter(f)}
                data-active={f.range === filter.range || undefined}
              >
                {f.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </div>
      {error && <p style={{ color: '#b00' }}>Error: {error}</p>}
      <div className="top-artists-grid">
        {artists.map((artist, i) => (
          <ArtistCard key={artist.id} rank={i + 1} artist={artist} />
        ))}
      </div>
    </div>
  )
}
