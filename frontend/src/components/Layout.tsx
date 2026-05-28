import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  AppShell,
  Burger,
  Group,
  Title,
  Drawer,
  NavLink,
  Avatar,
  Box,
  Button,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { auth, type SelfUser } from '../lib/api'
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
  const [opened, { toggle, close }] = useDisclosure(false)
  const [user, setUser] = useState<SelfUser | null>(null)
  const location = useLocation()

  // Hydrate auth state from the cookie session (null if not logged in).
  useEffect(() => {
    auth.me().then(setUser).catch(() => setUser(null))
  }, [])

  const handleLogout = () => {
    auth.logout().then(() => setUser(null))
  }

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header style={{ backgroundColor: TOP_BAR_COLOR, border: 'none' }}>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group style={{ flex: 1 }} justify="flex-start">
            <Burger
              opened={opened}
              onClick={toggle}
              color="white"
              aria-label="open sidebar"
              size={18}
              transitionDuration={0}
            />
          </Group>

          <Title order={4} c="white" fw={600} style={{ letterSpacing: '0.5px' }}>
            SpotSocial
          </Title>

          <Group style={{ flex: 1 }} justify="flex-end" gap="sm" wrap="nowrap">
            {user ? (
              <>
                <Avatar src={user.pfp || undefined} radius="xl" size={32} />
                <Button variant="filled" size="xs" color="dark" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="filled" size="xs" color="dark" onClick={() => auth.login()}>
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
