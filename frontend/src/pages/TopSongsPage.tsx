import { useState } from 'react'
import { Button, Menu } from '@mantine/core'
import './TopSongsPage.css'

// Placeholder data until the backend is integrated. Shaped like the real
// Spotify track so wiring the API in later is a drop-in swap.
interface Song {
  id: string
  title: string
  artists: string[]
  coverUrl: string | null
  externalUrl: string | null
  previewUrl: string | null
}

const placeholderSongs: Song[] = Array.from({ length: 10 }, (_, i) => ({
  id: String(i + 1),
  title: `Song ${i + 1}`,
  artists: [`Artist ${i + 1}`],
  coverUrl: null,
  // Placeholder link so the button is visible pre-integration. Real data
  // replaces this with the track's externalUrl from the Spotify API.
  externalUrl: `https://open.spotify.com/search/${encodeURIComponent(`Song ${i + 1}`)}`,
  previewUrl: null,
}))

const FILTERS = ['All Time', 'Last 6 Months', 'Last Month'] as const
type Filter = (typeof FILTERS)[number]

function Cover({ url, title }: { url: string | null; title: string }) {
  if (url) return <img className="song-cover" src={url} alt={title} />
  return <div className="song-cover song-cover-placeholder">♪</div>
}

function SongRow({ rank, song, hero }: { rank: number; song: Song; hero?: boolean }) {
  return (
    <div className={hero ? 'song-row song-row-hero' : 'song-row'}>
      <span className="song-rank">#{rank}</span>
      <Cover url={song.coverUrl} title={song.title} />
      <div className="song-info">
        <span className="song-title">{song.title}</span>
        <span className="song-artists">{song.artists.join(', ')}</span>
      </div>
      <div className="song-actions">
        {song.externalUrl && (
          <a
            className="song-play"
            href={song.externalUrl}
            target="_blank"
            rel="noreferrer"
          >
            ▶ Play on Spotify
          </a>
        )}
      </div>
    </div>
  )
}

export default function TopSongsPage() {
  const [filter, setFilter] = useState<Filter>('All Time')

  return (
    <div className="top-songs-page">
      <div className="top-songs-header">
        <h1 className="top-songs-title">Top Songs</h1>
        <Menu position="bottom-end" radius="md">
          <Menu.Target>
            <Button className="top-songs-filter">{filter} ▾</Button>
          </Menu.Target>
          <Menu.Dropdown className="top-songs-filter-menu">
            {FILTERS.map((f) => (
              <Menu.Item key={f} onClick={() => setFilter(f)} data-active={f === filter || undefined}>
                {f}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </div>

      <div className="top-songs-list">
        {placeholderSongs.map((song, i) => (
          <SongRow key={song.id} rank={i + 1} song={song} hero={i === 0} />
        ))}
      </div>
    </div>
  )
}
