import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Container, Paper, Stack, Text, Title } from '@mantine/core'
import { auth, type SelfUser } from '../lib/api'

export default function HomePage() {
  const [user, setUser] = useState<SelfUser | null>(null)
  const [checkedAuth, setCheckedAuth] = useState(false)

  // Check session on mount.
  useEffect(() => {
    auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCheckedAuth(true))
  }, [])

  if (!checkedAuth) return <p>Checking session...</p>

  if (!user) {
    return (
      <Container size="sm" py="xl">
        <Paper withBorder radius="lg" p="xl">
          <Stack gap="md">
            <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
              SpotSocial
            </Text>
            <Title order={1}>A simple place to share your Spotify taste.</Title>
            <Text c="dimmed">
              Sign in to view your profile, browse people, and jump into the forum.
            </Text>
            <Button onClick={() => auth.login()}>Sign in with Spotify</Button>
          </Stack>
        </Paper>
      </Container>
    )
  }

  return (
    <Container size="sm" py="xl">
      <Paper withBorder radius="lg" p="xl">
        <Stack gap="md">
          <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
            Welcome back
          </Text>
          <Title order={1}>{user.displayName || 'SpotSocial'}</Title>
          <Text c="dimmed">Your home page is ready. Use the menu above to move around.</Text>
          <Button component={Link} to="/profile">
            Go to profile
          </Button>
        </Stack>
      </Paper>
    </Container>
  )
}
