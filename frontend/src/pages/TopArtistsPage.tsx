import { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Menu,
  MenuItem,
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import './TopArtistsPage.css'

const placeholderArtists = Array.from({ length: 10 }, (_, i) => ({
  rank: i + 1,
  name: `Artist ${i + 1}`,
}))

const FILTERS = ['All Time', 'Last 6 Months', 'Last Month'] as const
type Filter = (typeof FILTERS)[number]

function ArtistCard({ rank, name }: { rank: number; name: string }) {
  return (
    <Card className="artist-card" elevation={0}>
      <CardContent className="artist-card-content">
        <Typography variant="h4" className="artist-rank">
          #{rank}
        </Typography>
        <Avatar className="artist-avatar" />
        <Typography variant="h6" className="artist-name">
          {name}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default function TopArtistsPage() {
  const [filter, setFilter] = useState<Filter>('All Time')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  return (
    <div className="top-artists-page">
      <div className="top-artists-header">
        <Typography variant="h3" className="top-artists-title">
          Top Artists
        </Typography>
        <Button
          className="top-artists-filter"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          endIcon={<KeyboardArrowDownIcon />}
          disableElevation
        >
          {filter}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
          className="top-artists-filter-menu"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {FILTERS.map((f) => (
            <MenuItem
              key={f}
              selected={f === filter}
              onClick={() => {
                setFilter(f)
                setAnchorEl(null)
              }}
            >
              {f}
            </MenuItem>
          ))}
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
