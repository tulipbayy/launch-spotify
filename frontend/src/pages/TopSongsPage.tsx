import { useEffect, useState } from 'react'
import { Button, Menu } from '@mantine/core'
import { spotify, ApiError, type Track, type RangeKey } from '../lib/api'
import './TopSongsPage.css'

const FILTERS: { label: string; range: RangeKey }[] = [
  { label: 'All Time', range: 'all_time' },
  { label: 'Last 6 Months', range: 'six_months' },
  { label: 'Last Month', range: 'one_month' },
]

function Cover({ url, title }: { url: string | undefined; title: string }) {
  if (url) return <img className="song-cover" src={url} alt={title} />
  return <div className="song-cover song-cover-placeholder">♪</div>
}

function SongRow({ rank, song, hero }: { rank: number; song: Track; hero?: boolean }) {
  return (
    <div className={hero ? 'song-row song-row-hero' : 'song-row'}>
      <span className="song-rank">#{rank}</span>
      <Cover url={song.album.images[0]?.url} title={song.name} />
      <div className="song-info">
        <span className="song-title">{song.name}</span>
        <span className="song-artists">{song.artists.join(', ')}</span>
      </div>
      <div className="song-actions">
        {song.externalUrl && (
          <a className="song-play" href={song.externalUrl} target="_blank" rel="noreferrer">
            ▶ Play on Spotify
          </a>
        )}
      </div>
    </div>
  )
}

export default function TopSongsPage() {
  const [filter, setFilter] = useState(FILTERS[0])
  const [songs, setSongs] = useState<Track[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    spotify
      .topTracks(filter.range)
      .then((r) => setSongs(r.items))
      .catch((e) =>
        setError(e instanceof ApiError ? `${e.status} ${e.message} (${e.code})` : String(e))
      )
  }, [filter])

  return (
    <div className="top-songs-page">
      <div className="top-songs-header">
        <h1 className="top-songs-title">Top Songs</h1>
        <Menu position="bottom-end" radius="md">
          <Menu.Target>
            <Button className="top-songs-filter">{filter.label} ▾</Button>
          </Menu.Target>
          <Menu.Dropdown className="top-songs-filter-menu">
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

      <div className="top-songs-list">
        {songs.map((song, i) => (
          <SongRow key={song.id} rank={i + 1} song={song} hero={i === 0} />
        ))}
      </div>
    </div>
  )
}
