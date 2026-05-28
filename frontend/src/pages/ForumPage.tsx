import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { forums, ApiError, type Forum } from '../lib/api'
import './ForumPage.css'

// Forum list/search/create via the modular backend (lib/api -> /api/forums,
// cookie session). Author is derived server-side from the session.
export default function ForumPage() {
  const [list, setList] = useState<Forum[]>([])
  const [search, setSearch] = useState('')
  const [newForumName, setNewForumName] = useState('')
  const [newForumDesc, setNewForumDesc] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const fail = (e: unknown) =>
    setError(e instanceof ApiError ? `${e.status} ${e.message} (${e.code})` : String(e))

  useEffect(() => {
    forums
      .list()
      .then((r) => setList(r.forums))
      .catch(fail)
      .finally(() => setLoading(false))
  }, [])

  const createForum = () => {
    if (!newForumName.trim()) return
    forums
      .create(newForumName.trim(), newForumDesc.trim())
      .then((r) => {
        setList((prev) => [...prev, r.forum])
        setNewForumName('')
        setNewForumDesc('')
        setShowForm(false)
      })
      .catch(fail)
  }

  const filteredForums = list.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="forum-page">
      <div className="forum-container">
        <div className="forum-header">
          <h1 className="forum-title">Forums</h1>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            + New Forum
          </button>
        </div>

        {error && <p className="forum-empty" style={{ color: '#ff6b6b' }}>Error: {error}</p>}

        {showForm && (
          <div className="forum-form">
            <h3>Create a Forum</h3>
            <input
              className="forum-input"
              type="text"
              placeholder="Forum name"
              value={newForumName}
              onChange={(e) => setNewForumName(e.target.value)}
            />
            <input
              className="forum-input"
              type="text"
              placeholder="Description (optional)"
              value={newForumDesc}
              onChange={(e) => setNewForumDesc(e.target.value)}
            />
            <button className="btn-primary" onClick={createForum}>
              Create
            </button>
          </div>
        )}

        <input
          className="forum-search"
          type="text"
          placeholder="Search forums..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p className="forum-empty">Loading forums...</p>
        ) : filteredForums.length === 0 ? (
          <p className="forum-empty">No forums found.</p>
        ) : (
          <div className="forum-list">
            {filteredForums.map((forum) => (
              <div
                key={forum.id}
                className="forum-card"
                onClick={() => navigate(`/forum/${forum.id}`)}
              >
                <div className="forum-card-info">
                  <h3>{forum.name}</h3>
                  <p>{forum.description}</p>
                </div>
                <span className="forum-card-meta">{forum.postCount} posts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
