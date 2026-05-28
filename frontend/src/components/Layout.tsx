import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  AppShell,
  Burger,
  Group,
  Title,
  Drawer,
  NavLink,
  Avatar,
  Text,
  Box,
  Button,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import './Layout.css'

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
  const [opened, { open, close }] = useDisclosure(false)
  const [spotifyId, setSpotifyId] = useState<string | null>(null)
  const [spotifyAvatar, setSpotifyAvatar] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const syncAuth = () => {
      setSpotifyId(localStorage.getItem('spotifyId'))
      setSpotifyAvatar(localStorage.getItem('spotifyAvatar'))
    }

    syncAuth()
    window.addEventListener('authChange', syncAuth)
    window.addEventListener('storage', syncAuth)
    return () => {
      window.removeEventListener('authChange', syncAuth)
      window.removeEventListener('storage', syncAuth)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('spotifyId')
    localStorage.removeItem('spotifyAvatar')
    setSpotifyId(null)
    setSpotifyAvatar(null)
    window.dispatchEvent(new Event('authChange'))
    window.location.href = '/profile'
  }

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header style={{ backgroundColor: TOP_BAR_COLOR, border: 'none' }}>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group style={{ flex: 1 }} justify="flex-start">
            <Burger opened={opened} onClick={open} color="white" aria-label="open sidebar" />
          </Group>

          <Title order={4} c="white" fw={600} style={{ letterSpacing: '0.5px' }}>
            Spotify App
          </Title>

          <Group style={{ flex: 1 }} justify="flex-end" gap="sm" wrap="nowrap">
            {spotifyId ? (
              <>
                <Avatar src={spotifyAvatar || undefined} radius="xl" size={32} />
                <Button
                  variant="filled"
                  size="xs"
                  color="dark"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                variant="filled"
                size="xs"
                color="dark"
                component="a"
                href="http://localhost:5001/auth/login"
              >
                Login with Spotify
              </Button>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <Drawer
        opened={opened}
        onClose={close}
        size={240}
        withCloseButton={false}
        padding={0}
        styles={{ content: { backgroundColor: SIDEBAR_COLOR } }}
      >
        <Box py="xs">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              component={Link}
              to={item.path}
              label={item.label}
              active={location.pathname === item.path}
              onClick={close}
              className="sidebar-navlink"
              styles={{
                root: { color: '#fff' },
                label: { fontSize: 'var(--mantine-font-size-md)' },
              }}
            />
          ))}
        </Box>
      </Drawer>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
