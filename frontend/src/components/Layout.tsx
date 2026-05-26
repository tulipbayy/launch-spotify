import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Avatar,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'

const TOP_BAR_COLOR = '#011A27'
const SIDEBAR_COLOR = '#003049'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Liked Songs', path: '/liked' },
  { label: 'Top Artists', path: '/top-artists' },
  { label: 'Top Songs', path: '/top-songs' },
  { label: 'Profile', path: '/profile' },
  { label: 'Discover', path: '/discover' },
  { label: 'Inbox', path: '/inbox' },
  { label: 'Forum', path: '/forum' },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0} sx={{ backgroundColor: TOP_BAR_COLOR }}>
        <Toolbar>
          <Box sx={{ flex: 1, display: 'flex' }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open sidebar"
              onClick={() => setOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, letterSpacing: '0.5px' }}
          >
            Spotify App
          </Typography>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Avatar sx={{ width: 32, height: 32 }} />
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: SIDEBAR_COLOR,
              color: '#fff',
              width: 240,
            },
          },
        }}
      >
        <List>
          {navItems.map((item) => {
            const selected = location.pathname === item.path
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={selected}
                  onClick={() => setOpen(false)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 255, 255, 0.16)',
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.24)',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 2 }}>
        <Outlet />
      </Box>
    </Box>
  )
}
