import { useEffect, useState, useCallback } from 'react'
import { messages, auth, type Conversation, type Message } from '../lib/api'
import '../InboxPage.css'

function formatTime(ms: number | null) {
  if (!ms) return ''
  return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function InboxPage() {
  const params = new URLSearchParams(window.location.search)
  const initialUserId = params.get('userId')

  const [meId, setMeId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeUserId, setActiveUserId] = useState<string | null>(initialUserId)
  const [thread, setThread] = useState<Message[]>([])
  const [activeName, setActiveName] = useState<string>('')
  const [newMessage, setNewMessage] = useState('')

  const loadConversations = useCallback(() => {
    messages.conversations().then((r) => setConversations(r.conversations)).catch(() => {})
  }, [])

  useEffect(() => {
    auth.me().then((u) => setMeId(u?.id ?? null))
    loadConversations()
  }, [loadConversations])

  // Load a thread when the active conversation changes.
  useEffect(() => {
    if (!activeUserId) return
    messages
      .conversation(activeUserId)
      .then((r) => {
        setThread(r.messages)
        setActiveName(r.conversation?.otherUserName || activeUserId)
      })
      .catch(() => {})
  }, [activeUserId])

  const openConversation = (c: Conversation) => {
    if (!c.otherUserId) return
    setActiveUserId(c.otherUserId)
    setActiveName(c.otherUserName || c.otherUserId)
  }

  const sendMessage = () => {
    if (!activeUserId || !newMessage.trim()) return
    messages
      .send(activeUserId, newMessage.trim())
      .then(() => {
        setNewMessage('')
        return Promise.all([
          messages.conversation(activeUserId).then((r) => setThread(r.messages)),
          loadConversations(),
        ])
      })
      .catch(() => {})
  }

  return (
    <main className="inbox-page">
      <section className="inbox-card">
        <div className="inbox-left">
          <div className="inbox-header">
            <h1>Inbox</h1>
            <p>Message other music fans</p>
          </div>

          <div className="search-bar">
            <span>⌕</span>
            <input type="text" placeholder="Search chats..." />
          </div>

          <div className="chat-list">
            {conversations.length === 0 && <p style={{ padding: '0 16px' }}>No conversations yet.</p>}
            {conversations.map((chat) => (
              <button
                key={chat.id}
                className={chat.otherUserId === activeUserId ? 'chat-row selected' : 'chat-row'}
                onClick={() => openConversation(chat)}
              >
                <div className="avatar">{(chat.otherUserName || '?').charAt(0)}</div>
                <div className="chat-info">
                  <div className="chat-name-row">
                    <h3>{chat.otherUserName || chat.otherUserId}</h3>
                    <span>{formatTime(chat.lastMessageAt)}</span>
                  </div>
                  <p>{chat.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {activeUserId && (
          <div className="inbox-right">
            <div className="chat-header">
              <div className="active-user">
                <div className="avatar">{activeName.charAt(0)}</div>
                <div>
                  <h2>{activeName}</h2>
                </div>
              </div>
            </div>

            <div className="messages">
              {thread.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.senderId === meId ? 'message-wrap mine' : 'message-wrap theirs'
                  }
                >
                  <div
                    className={
                      message.senderId === meId ? 'message my-message' : 'message their-message'
                    }
                  >
                    {message.text}
                  </div>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
              ))}
            </div>

            <div className="type-row">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendMessage()
                }}
              />
              <button onClick={sendMessage}>➤</button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
