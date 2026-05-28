import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ForumDetailPage.css";

export default function ForumDetailPage() {
  const { id } = useParams();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    const fetchPosts = async () => {
      const response = await fetch(
        `http://127.0.0.1:3001/api/forums/${id}/posts`
      );
      const data = await response.json();
      setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, [id]);

  const createPost = async () => {
    if (!newPost.trim()) return;
    const response = await fetch(
      `http://127.0.0.1:3001/api/forums/${id}/posts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPost, createdBy: userId }),
      }
    );
    const post = await response.json();
    setPosts([post, ...posts]);
    setNewPost("");
  };

  const likePost = async (postId: string) => {
    await fetch(`http://127.0.0.1:3001/api/posts/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setPosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              likes: p.likedBy?.includes(userId) ? p.likes - 1 : p.likes + 1,
              likedBy: p.likedBy?.includes(userId)
                ? p.likedBy.filter((uid: string) => uid !== userId)
                : [...(p.likedBy || []), userId],
            }
          : p
      )
    );
  };

  return (
    <div className="detail-page">
      <div className="detail-container">
        <button className="detail-back" onClick={() => navigate("/forum")}>
          ← Back to Forums
        </button>

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
                  <span className="post-author">
                    Posted by {post.createdBy}
                  </span>
                  <button
                    onClick={() => likePost(post.id)}
                    className={`btn-like ${
                      post.likedBy?.includes(userId) ? "liked" : "unliked"
                    }`}
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
  );
}
