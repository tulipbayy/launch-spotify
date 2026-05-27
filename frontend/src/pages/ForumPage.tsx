import { useEffect, useState } from 'react'
import { forums, ApiError, type Forum, type Post } from '../lib/api'

// TEMPORARY data-dump page (no CSS). Exercises every forum/post endpoint:
// list, search, create forum, list posts, create post, like post.
export default function ForumPage() {
  const [list, setList] = useState<Forum[]>([])
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [active, setActive] = useState<Forum | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [postBody, setPostBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fail = (e: unknown) =>
    setError(e instanceof ApiError ? `${e.status} ${e.message} (${e.code})` : String(e))

  const loadForums = (q = '') => forums.list(q).then((r) => setList(r.forums)).catch(fail)

  useEffect(() => {
    loadForums()
  }, [])

  const createForum = () => {
    if (!newName.trim()) return
    forums
      .create(newName.trim(), newDesc.trim())
      .then(() => {
        setNewName('')
        setNewDesc('')
        return loadForums(search)
      })
      .catch(fail)
  }

  const openForum = (f: Forum) => {
    setError(null)
    setActive(f)
    forums.posts(f.id).then((r) => setPosts(r.posts)).catch(fail)
  }

  const createPost = () => {
    if (!active || !postBody.trim()) return
    forums
      .createPost(active.id, postBody.trim())
      .then(() => {
        setPostBody('')
        return forums.posts(active.id).then((r) => setPosts(r.posts))
      })
      .catch(fail)
  }

  const like = (postId: string) => {
    if (!active) return
    forums
      .likePost(active.id, postId)
      .then((r) =>
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, liked: r.liked, likeCount: r.likeCount } : p))
        )
      )
      .catch(fail)
  }

  return (
    <div>
      <h2>Forums</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <h3>Search</h3>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="forum name" />
      <button onClick={() => loadForums(search)}>Search</button>
      <button onClick={() => { setSearch(''); loadForums('') }}>Clear</button>

      <h3>Create forum</h3>
      <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="name" />
      <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="description" />
      <button onClick={createForum} disabled={!newName.trim()}>Create</button>

      <h3>All forums ({list.length})</h3>
      {list.length === 0 && <p>No forums yet.</p>}
      <ul>
        {list.map((f) => (
          <li key={f.id}>
            <b>{f.name}</b> — {f.description} (posts: {f.postCount}, by {f.createdByName}){' '}
            <button onClick={() => openForum(f)}>Open</button>
          </li>
        ))}
      </ul>

      {active && (
        <div>
          <h3>Posts in "{active.name}"</h3>
          <input value={postBody} onChange={(e) => setPostBody(e.target.value)} placeholder="post body" />
          <button onClick={createPost} disabled={!postBody.trim()}>Post</button>
          {posts.length === 0 && <p>No posts yet.</p>}
          <ul>
            {posts.map((p) => (
              <li key={p.id}>
                <b>{p.authorName}:</b> {p.body} — {p.likeCount} likes{' '}
                <button onClick={() => like(p.id)}>{p.liked ? 'Unlike' : 'Like'}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
