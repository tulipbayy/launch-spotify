import { useState } from 'react'
import { Card, Avatar, Button, Menu } from '@mantine/core'
import './TopArtistsPage.css'

const placeholderArtists = Array.from({ length: 10 }, (_, i) => ({
  rank: i + 1,
  name: `Artist ${i + 1}`,
}))

const FILTERS = ['All Time', 'Last 6 Months', 'Last Month'] as const
type Filter = (typeof FILTERS)[number]

function ArtistCard({ rank, name }: { rank: number; name: string }) {
  return (
    <Card className="artist-card" radius="lg" padding={0}>
      <div className="artist-card-content">
        <span className="artist-rank">#{rank}</span>
        <Avatar className="artist-avatar" radius="50%" />
        <span className="artist-name">{name}</span>
      </div>
    </Card>
  )
}

export default function TopArtistsPage() {
  const [filter, setFilter] = useState<Filter>('All Time')

  return (
    <div className="top-artists-page">
      <div className="top-artists-header">
        <h1 className="top-artists-title">Top Artists</h1>
        <Menu position="bottom-end" radius="md">
          <Menu.Target>
            <Button className="top-artists-filter">{filter} ▾</Button>
          </Menu.Target>
          <Menu.Dropdown className="top-artists-filter-menu">
            {FILTERS.map((f) => (
              <Menu.Item key={f} onClick={() => setFilter(f)} data-active={f === filter || undefined}>
                {f}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </div>
      <div className="top-artists-grid">
        {placeholderArtists.map((artist) => (
          <ArtistCard key={artist.rank} rank={artist.rank} name={artist.name} />
        ))}
      </div>
    </div>
  )
}
