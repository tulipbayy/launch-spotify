import { useEffect, useState } from 'react'
import {
  messages,
  auth,
  ApiError,
  type Conversation,
  type Message,
} from '../lib/api'

// TEMPORARY data-dump page (no CSS). Lists conversations; open one to view +
// send messages. Type a user id to start a new conversation.
export default function InboxPage() {
  const [meId, setMeId] = useState<string | null>(null)
  const [convos, setConvos] = useState<Conversation[]>([])
  const [openWith, setOpenWith] = useState<string>('')
  const [thread, setThread] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [newUserId, setNewUserId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fail = (e: unknown) =>
    setError(e instanceof ApiError ? `${e.status} ${e.message} (${e.code})` : String(e))

  const loadConvos = () => messages.conversations().then((r) => setConvos(r.conversations)).catch(fail)

  useEffect(() => {
    auth.me().then((u) => setMeId(u?.id ?? null))
    loadConvos()
  }, [])

  const open = (userId: string) => {
    setError(null)
    setOpenWith(userId)
    messages.conversation(userId).then((r) => setThread(r.messages)).catch(fail)
  }

  const send = () => {
    if (!openWith || !draft.trim()) return
    messages
      .send(openWith, draft.trim())
      .then(() => {
        setDraft('')
        return Promise.all([open(openWith), loadConvos()])
      })
      .catch(fail)
  }

  return (
    <div>
      <h2>Inbox</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <p>My id: {meId ?? '(unknown)'}</p>

      <h3>Conversations</h3>
      {convos.length === 0 && <p>No conversations yet.</p>}
      <ul>
        {convos.map((c) => (
          <li key={c.id}>
            {c.otherUserName || c.otherUserId} — "{c.lastMessage}"{' '}
            <button onClick={() => open(c.otherUserId!)}>Open</button>
          </li>
        ))}
      </ul>

      <h3>Start / open conversation by user id</h3>
      <input
        placeholder="other user id"
        value={newUserId}
        onChange={(e) => setNewUserId(e.target.value)}
      />
      <button onClick={() => open(newUserId.trim())} disabled={!newUserId.trim()}>
        Open
      </button>

      {openWith && (
        <div>
          <h3>Thread with {openWith}</h3>
          <ol>
            {thread.map((m) => (
              <li key={m.id}>
                <b>{m.senderId === meId ? 'me' : m.senderId}:</b> {m.text}
              </li>
            ))}
          </ol>
          <input
            placeholder="message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button onClick={send} disabled={!draft.trim()}>
            Send
          </button>
        </div>
      )}
    </div>
  )
}
