import { useEffect, useState } from 'react'
import { profile, ApiError, type SelfUser, type RangeKey } from '../lib/api'

// TEMPORARY data-dump + edit page (no CSS). Exercises profile write endpoints.
const RANGES: RangeKey[] = ['all_time', 'six_months', 'one_month']

export default function ProfilePage() {
  const [user, setUser] = useState<SelfUser | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const fail = (e: unknown) =>
    setError(e instanceof ApiError ? `${e.status} ${e.message} (${e.code})` : String(e))

  const load = () => {
    setError(null)
    profile
      .get()
      .then((r) => {
        setUser(r.user)
        setDisplayName(r.user.profile?.displayName || '')
        setBio(r.user.profile?.bio || '')
      })
      .catch(fail)
  }

  useEffect(load, [])

  const saveProfile = () => {
    setStatus(null)
    profile
      .update({ displayName, bio })
      .then((r) => {
        setUser(r.user)
        setStatus('Profile saved.')
      })
      .catch(fail)
  }

  const toggleVisibility = () => {
    if (!user) return
    profile
      .setVisibility(!user.isPrivate)
      .then((r) => setUser(r.user))
      .catch(fail)
  }

  const setRange = (range: RangeKey) => {
    profile
      .setDisplayed({ displayedRange: range })
      .then((r) => setUser(r.user))
      .catch(fail)
  }

  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>
  if (!user) return <p>Loading profile...</p>

  return (
    <div>
      <h2>My Profile</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>

      <h3>Edit</h3>
      <div>
        <label>
          Display name:{' '}
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          Bio:{' '}
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} cols={40} />
        </label>
      </div>
      <button onClick={saveProfile}>Save profile</button>
      {status && <span style={{ marginLeft: 8, color: 'green' }}>{status}</span>}

      <h3>Visibility</h3>
      <p>Currently: {user.isPrivate ? 'PRIVATE' : 'PUBLIC'}</p>
      <button onClick={toggleVisibility}>
        Make {user.isPrivate ? 'public' : 'private'}
      </button>

      <h3>Displayed range (currently: {user.displayedRange})</h3>
      <div>
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            disabled={r === user.displayedRange}
            style={{ marginRight: 8 }}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  )
}
