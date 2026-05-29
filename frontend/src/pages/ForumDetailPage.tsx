import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ForumDetailPage.css";

// ─── Types ────────────────────────────────────────────────────

interface MusicTag {
  type: "track" | "artist" | "album";
  id: string;
  name: string;
  subtitle: string;
  image: string | null;
  spotifyUrl: string;
}

interface Reply {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
}

interface Post {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
  likes: string[];
  musicTag?: MusicTag;
  replies?: Reply[];
  repliesLoaded?: boolean;
  repliesOpen?: boolean;
  replyText?: string;
  replySubmitting?: boolean;
}

interface Forum {
  id: string;
  title: string;
  description?: string;
  createdBy?: string;
}

const TYPE_LABEL: Record<MusicTag["type"], string> = {
  track: "🎵",
  artist: "🎤",
  album: "💿",
};

function formatDate(str: string) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────

export default function ForumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [forum, setForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // composer
  const [newText, setNewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // music tag
  const [tagQuery, setTagQuery] = useState("");
  const [tagResults, setTagResults] = useState<MusicTag[]>([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<MusicTag | null>(null);
  const [showTagSearch, setShowTagSearch] = useState(false);
  const tagRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // edit / delete post
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editText, setEditText] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState(false);

  const getToken = () => sessionStorage.getItem("accessToken") ?? "";
  // Profile page stores id in localStorage as 'spotifyId'; App.tsx stores as sessionStorage 'userId'
  const userId =
    sessionStorage.getItem("userId") || localStorage.getItem("spotifyId") || "";
  const myDisplayName =
    sessionStorage.getItem("displayName") ||
    localStorage.getItem("spotifyDisplayName") ||
    "";

  // ── Helpers ───────────────────────────────────────────────────

  const updatePost = (postId: string, patch: Partial<Post>) =>
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...patch } : p))
    );

  const fetchDisplayNames = useCallback(
    async (ids: string[]) => {
      const missing = ids.filter((id) => id && !displayNames[id]);
      if (missing.length === 0) return;
      try {
        const res = await fetch("http://127.0.0.1:5001/api/profiles/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ userIds: missing }),
        });
        if (res.ok) {
          const names = await res.json();
          setDisplayNames((prev) => ({ ...prev, ...names }));
        }
      } catch {
        /* silent */
      }
    },
    [displayNames]
  );

  const getName = (uid: string) => displayNames[uid] || uid;

  // ── Load forum + posts ────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      const token = getToken();
      try {
        const [forumRes, postsRes] = await Promise.all([
          fetch(`http://127.0.0.1:5001/api/forums/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://127.0.0.1:5001/api/forums/${id}/posts`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (!forumRes.ok) {
          setLoadError(`Could not load forum (${forumRes.status})`);
          return;
        }
        if (!postsRes.ok) {
          setLoadError(`Could not load posts (${postsRes.status})`);
          return;
        }

        const forumData: Forum = await forumRes.json();
        const postsData: Post[] = await postsRes.json();

        setForum(forumData);
        setPosts(Array.isArray(postsData) ? postsData : []);

        // Batch-fetch all display names at once (always include self)
        const ids = [
          forumData.createdBy,
          userId,
          ...(Array.isArray(postsData)
            ? postsData.map((p) => p.createdBy)
            : []),
        ].filter(Boolean) as string[];

        if (ids.length > 0) {
          const namesRes = await fetch(
            "http://127.0.0.1:5001/api/profiles/batch",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ userIds: [...new Set(ids)] }),
            }
          );
          if (namesRes.ok) {
            const names = await namesRes.json();
            setDisplayNames(names);
            // Cache own display name in sessionStorage for instant use next time
            if (userId && names[userId]) {
              sessionStorage.setItem("displayName", names[userId]);
              localStorage.setItem("spotifyDisplayName", names[userId]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load forum:", err);
        setLoadError("Network error — is the backend running?");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Outside click for tag dropdown ───────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagRef.current && !tagRef.current.contains(e.target as Node))
        setShowTagSearch(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Music search ─────────────────────────────────────────────

  const searchMusic = useCallback(async (query: string) => {
    if (!query.trim()) {
      setTagResults([]);
      return;
    }
    setTagLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:5001/api/spotify/search?q=${encodeURIComponent(
          query
        )}&type=track,artist,album`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setTagResults(res.ok ? await res.json() : []);
    } catch {
      setTagResults([]);
    } finally {
      setTagLoading(false);
    }
  }, []);

  const handleTagQueryChange = (val: string) => {
    setTagQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchMusic(val), 350);
  };

  const pickTag = (tag: MusicTag) => {
    setSelectedTag(tag);
    setShowTagSearch(false);
    setTagQuery("");
    setTagResults([]);
  };
  const clearTag = () => {
    setSelectedTag(null);
    setTagQuery("");
    setTagResults([]);
  };

  // ── Submit post ───────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!newText.trim()) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        text: newText.trim(),
        createdBy: userId,
      };
      if (selectedTag) body.musicTag = selectedTag;
      const res = await fetch(`http://127.0.0.1:5001/api/forums/${id}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error("Post failed:", await res.text());
        return;
      }
      const post = await res.json();
      setPosts((prev) => [post, ...prev]);
      setNewText("");
      clearTag();
      // Immediately seed own name so it shows without waiting for the fetch
      const cachedName =
        sessionStorage.getItem("displayName") ||
        localStorage.getItem("spotifyDisplayName");
      if (userId && cachedName) {
        setDisplayNames((prev) => ({ ...prev, [userId]: cachedName }));
      }
      fetchDisplayNames([userId]);
    } catch (err) {
      console.error("Failed to submit post:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit post ─────────────────────────────────────────────────

  const handleEditPost = async () => {
    if (!editingPost || !editText.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:5001/api/posts/${editingPost.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ text: editText.trim() }),
        }
      );
      if (!res.ok) return;
      updatePost(editingPost.id, { text: editText.trim() });
      setEditingPost(null);
    } catch (err) {
      console.error("Failed to edit post:", err);
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete post ───────────────────────────────────────────────

  const handleDeletePost = async () => {
    if (!deletingPostId) return;
    setDeletingPost(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:5001/api/posts/${deletingPostId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (!res.ok) return;
      setPosts((prev) => prev.filter((p) => p.id !== deletingPostId));
      setDeletingPostId(null);
    } catch (err) {
      console.error("Failed to delete post:", err);
    } finally {
      setDeletingPost(false);
    }
  };

  // ── Like ──────────────────────────────────────────────────────

  const handleLike = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const alreadyLiked = post.likes.includes(userId);
    updatePost(postId, {
      likes: alreadyLiked
        ? post.likes.filter((u) => u !== userId)
        : [...post.likes, userId],
    });
    try {
      await fetch(`http://127.0.0.1:5001/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ userId }),
      });
    } catch {
      updatePost(postId, { likes: post.likes }); // roll back
    }
  };

  // ── Replies ───────────────────────────────────────────────────

  const toggleReplies = async (post: Post) => {
    if (post.repliesOpen) {
      updatePost(post.id, { repliesOpen: false });
      return;
    }
    // Load replies if not yet fetched
    if (!post.repliesLoaded) {
      try {
        const res = await fetch(
          `http://127.0.0.1:5001/api/posts/${post.id}/replies`,
          {
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        );
        const replies: Reply[] = res.ok ? await res.json() : [];
        updatePost(post.id, {
          replies,
          repliesLoaded: true,
          repliesOpen: true,
        });
        const replyIds = replies.map((r) => r.createdBy).filter(Boolean);
        if (replyIds.length > 0) fetchDisplayNames(replyIds);
      } catch {
        updatePost(post.id, {
          replies: [],
          repliesLoaded: true,
          repliesOpen: true,
        });
      }
    } else {
      updatePost(post.id, { repliesOpen: true });
    }
  };

  const handleReplySubmit = async (post: Post) => {
    const text = post.replyText?.trim();
    if (!text) return;
    updatePost(post.id, { replySubmitting: true });
    try {
      const res = await fetch(
        `http://127.0.0.1:5001/api/posts/${post.id}/replies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ text, createdBy: userId }),
        }
      );
      if (!res.ok) {
        updatePost(post.id, { replySubmitting: false });
        return;
      }
      const reply: Reply = await res.json();
      updatePost(post.id, {
        replies: [...(post.replies ?? []), reply],
        replyText: "",
        replySubmitting: false,
        repliesOpen: true,
        repliesLoaded: true,
      });
      fetchDisplayNames([userId]);
    } catch {
      updatePost(post.id, { replySubmitting: false });
    }
  };

  const handleDeleteReply = async (post: Post, replyId: string) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5001/api/posts/${post.id}/replies/${replyId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (!res.ok) return;
      updatePost(post.id, {
        replies: (post.replies ?? []).filter((r) => r.id !== replyId),
      });
    } catch (err) {
      console.error("Failed to delete reply:", err);
    }
  };

  // ── Render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-skeleton-header">
          <div
            className="skeleton-box"
            style={{ height: "28px", width: "35%" }}
          />
          <div
            className="skeleton-box"
            style={{ height: "14px", width: "55%", marginTop: "8px" }}
          />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="post-skeleton"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div
              className="skeleton-box"
              style={{ height: "14px", width: "80%" }}
            />
            <div
              className="skeleton-box"
              style={{ height: "14px", width: "60%", marginTop: "8px" }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="detail-page">
        <p className="no-posts" style={{ color: "#e07b00" }}>
          {loadError}
        </p>
      </div>
    );
  }

  return (
    <div className="detail-page">
      {/* Edit post modal */}
      {editingPost && (
        <div className="modal-overlay" onClick={() => setEditingPost(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Edit Post</h2>
            <textarea
              className="modal-textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setEditingPost(null)}
              >
                Cancel
              </button>
              <button
                className="btn-submit"
                onClick={handleEditPost}
                disabled={!editText.trim() || editSaving}
              >
                {editSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete post modal */}
      {deletingPostId && (
        <div className="modal-overlay" onClick={() => setDeletingPostId(null)}>
          <div
            className="modal modal--compact"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">Delete Post?</h2>
            <p className="modal-body-text">This cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setDeletingPostId(null)}
              >
                Cancel
              </button>
              <button
                className="btn-delete-confirm"
                onClick={handleDeletePost}
                disabled={deletingPost}
              >
                {deletingPost ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forum header */}
      <div className="detail-header">
        <h1 className="detail-title">{forum?.title}</h1>
        {forum?.description && (
          <p className="detail-desc">{forum.description}</p>
        )}
        {forum?.createdBy && (
          <p className="detail-creator">
            Created by{" "}
            <span className="detail-creator-name">
              {getName(forum.createdBy)}
            </span>
          </p>
        )}
      </div>

      {/* Composer */}
      <div className="composer">
        <textarea
          className="composer-input"
          placeholder="Share your thoughts…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          rows={3}
        />

        {selectedTag && (
          <div className="tag-preview">
            {selectedTag.image && (
              <img
                src={selectedTag.image}
                alt={selectedTag.name}
                className="tag-preview-img"
              />
            )}
            <div className="tag-preview-info">
              <span className="tag-type-badge">
                {TYPE_LABEL[selectedTag.type]} {selectedTag.type}
              </span>
              <span className="tag-preview-name">{selectedTag.name}</span>
              <span className="tag-preview-sub">{selectedTag.subtitle}</span>
            </div>
            <button className="tag-clear" onClick={clearTag}>
              &#x2715;
            </button>
          </div>
        )}

        {showTagSearch && !selectedTag && (
          <div className="tag-search-wrap" ref={tagRef}>
            <input
              className="tag-search-input"
              placeholder="Search songs, artists, albums…"
              value={tagQuery}
              onChange={(e) => handleTagQueryChange(e.target.value)}
              autoFocus
            />
            {tagLoading && <p className="tag-searching">Searching…</p>}
            {!tagLoading && tagResults.length > 0 && (
              <ul className="tag-results">
                {tagResults.map((result) => (
                  <li
                    key={`${result.type}-${result.id}`}
                    className="tag-result-item"
                    onClick={() => pickTag(result)}
                  >
                    {result.image ? (
                      <img
                        src={result.image}
                        alt={result.name}
                        className="tag-result-img"
                      />
                    ) : (
                      <div className="tag-result-img tag-result-img--placeholder">
                        {TYPE_LABEL[result.type]}
                      </div>
                    )}
                    <div className="tag-result-info">
                      <span className="tag-result-name">{result.name}</span>
                      <span className="tag-result-sub">
                        {TYPE_LABEL[result.type]} {result.type} ·{" "}
                        {result.subtitle}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {!tagLoading && tagQuery.trim() && tagResults.length === 0 && (
              <p className="tag-no-results">No results for "{tagQuery}"</p>
            )}
          </div>
        )}

        <div className="composer-actions">
          {!selectedTag && (
            <button
              className="btn-tag"
              onClick={() => setShowTagSearch((v) => !v)}
            >
              🎵 Tag music
            </button>
          )}
          <button
            className="btn-post"
            onClick={handleSubmit}
            disabled={!newText.trim() || submitting}
          >
            {submitting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <p className="no-posts">No posts yet — be the first!</p>
      ) : (
        <div className="posts-list">
          {posts.map((post) => {
            const liked =
              Array.isArray(post.likes) && post.likes.includes(userId);
            const isOwner = post.createdBy === userId;
            const replyCount = post.replies?.length ?? 0;

            return (
              <div key={post.id} className="post-card">
                {/* Post author */}
                <div className="post-author-row">
                  <div className="post-avatar">
                    {getName(post.createdBy).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="post-author-name">
                      {getName(post.createdBy)}
                    </span>
                    <span className="post-author-date">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                </div>

                <p className="post-text">{post.text}</p>

                {/* Music tag */}
                {post.musicTag && (
                  <a
                    href={post.musicTag.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="post-tag"
                  >
                    {post.musicTag.image && (
                      <img
                        src={post.musicTag.image}
                        alt={post.musicTag.name}
                        className="post-tag-img"
                      />
                    )}
                    <div className="post-tag-info">
                      <span className="post-tag-type">
                        {TYPE_LABEL[post.musicTag.type]} {post.musicTag.type}
                      </span>
                      <span className="post-tag-name">
                        {post.musicTag.name}
                      </span>
                      <span className="post-tag-sub">
                        {post.musicTag.subtitle}
                      </span>
                    </div>
                    <span className="post-tag-arrow">↗</span>
                  </a>
                )}

                {/* Post footer */}
                <div className="post-footer">
                  <div className="post-footer-left">
                    <button
                      className="btn-reply-toggle"
                      onClick={() => toggleReplies(post)}
                    >
                      💬{" "}
                      {post.repliesOpen
                        ? "Hide"
                        : replyCount > 0
                        ? `${replyCount} ${
                            replyCount === 1 ? "reply" : "replies"
                          }`
                        : "Reply"}
                    </button>
                  </div>
                  <div className="post-footer-actions">
                    {isOwner && (
                      <>
                        <button
                          className="btn-icon btn-icon--edit"
                          onClick={() => {
                            setEditingPost(post);
                            setEditText(post.text);
                          }}
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          className="btn-icon btn-icon--delete"
                          onClick={() => setDeletingPostId(post.id)}
                          title="Delete"
                        >
                          🗑
                        </button>
                      </>
                    )}
                    <button
                      className={`btn-like ${liked ? "liked" : ""}`}
                      onClick={() => handleLike(post.id)}
                    >
                      {liked ? "♥" : "♡"}{" "}
                      {Array.isArray(post.likes) ? post.likes.length : 0}
                    </button>
                  </div>
                </div>

                {/* Replies section */}
                {post.repliesOpen && (
                  <div className="replies-section">
                    {(post.replies ?? []).length > 0 && (
                      <div className="replies-list">
                        {(post.replies ?? []).map((reply) => (
                          <div key={reply.id} className="reply-card">
                            <div className="reply-avatar">
                              {getName(reply.createdBy).charAt(0).toUpperCase()}
                            </div>
                            <div className="reply-body">
                              <div className="reply-header">
                                <span className="reply-author">
                                  {getName(reply.createdBy)}
                                </span>
                                <span className="reply-date">
                                  {formatDate(reply.createdAt)}
                                </span>
                                {reply.createdBy === userId && (
                                  <button
                                    className="btn-reply-delete"
                                    onClick={() =>
                                      handleDeleteReply(post, reply.id)
                                    }
                                    title="Delete reply"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                              <p className="reply-text">{reply.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply composer */}
                    <div className="reply-composer">
                      <div className="reply-avatar">
                        {userId ? getName(userId).charAt(0).toUpperCase() : "?"}
                      </div>
                      <div className="reply-input-wrap">
                        <input
                          className="reply-input"
                          placeholder="Write a reply…"
                          value={post.replyText ?? ""}
                          onChange={(e) =>
                            updatePost(post.id, { replyText: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleReplySubmit(post);
                            }
                          }}
                        />
                        <button
                          className="btn-reply-submit"
                          onClick={() => handleReplySubmit(post)}
                          disabled={
                            !post.replyText?.trim() || post.replySubmitting
                          }
                        >
                          {post.replySubmitting ? "…" : "↑"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
