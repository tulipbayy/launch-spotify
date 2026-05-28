import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { forums, ApiError, type Post } from '../lib/api'
import './ForumDetailPage.css'

// Forum detail (posts) via the modular backend (lib/api, cookie session).
export default function ForumDetailPage() {
  const { id } = useParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const fail = (e: unknown) =>
    setError(e instanceof ApiError ? `${e.status} ${e.message} (${e.code})` : String(e))

  useEffect(() => {
    if (!id) return
    forums
      .posts(id)
      .then((r) => setPosts(r.posts))
      .catch(fail)
      .finally(() => setLoading(false))
  }, [id])

  const createPost = () => {
    if (!id || !newPost.trim()) return
    forums
      .createPost(id, newPost.trim())
      .then((r) => {
        setPosts((prev) => [r.post, ...prev])
        setNewPost('')
      })
      .catch(fail)
  }

  const likePost = (postId: string) => {
    if (!id) return
    forums
      .likePost(id, postId)
      .then((r) =>
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, liked: r.liked, likes: r.likes } : p
          )
        )
      )
      .catch(fail)
  }

  return (
    <div className="detail-page">
      <div className="detail-container">
        <button className="detail-back" onClick={() => navigate('/forum')}>
          ← Back to Forums
        </button>

        {error && <p className="detail-empty" style={{ color: '#ff6b6b' }}>Error: {error}</p>}

        <div className="post-form">
          <h3>Write a post</h3>
          <textarea
            className="post-textarea"
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={3}
          />
          <button className="btn-primary" onClick={createPost}>
            Post
          </button>
        </div>

        {loading ? (
          <p className="detail-empty">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="detail-empty">No posts yet. Be the first!</p>
        ) : (
          <div className="post-list">
            {posts.map((post) => (
              <div key={post.id} className="post-card">
                <p className="post-content">{post.content}</p>
                <div className="post-footer">
                  <span className="post-author">Posted by {post.authorName}</span>
                  <button
                    onClick={() => likePost(post.id)}
                    className={`btn-like ${post.liked ? 'liked' : 'unliked'}`}
                  >
                    Like {post.likes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
