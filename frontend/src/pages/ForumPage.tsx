import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ForumPage.css";

interface Forum {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  postCount?: number;
  createdBy?: string;
  creatorName?: string;
}

export default function ForumPage() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingForum, setEditingForum] = useState<Forum | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const getToken = () => sessionStorage.getItem("accessToken") ?? "";
  // Profile page stores id in localStorage as 'spotifyId'; App.tsx stores as sessionStorage 'userId'
  const userId =
    sessionStorage.getItem("userId") || localStorage.getItem("spotifyId") || "";

  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/forums", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setForums(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch forums:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/forums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          createdBy: userId,
        }),
      });
      const forum = await res.json();
      const myName =
        sessionStorage.getItem("displayName") ||
        localStorage.getItem("spotifyDisplayName") ||
        userId;
      setForums((prev) => [{ ...forum, creatorName: myName }, ...prev]);
      setNewTitle("");
      setNewDesc("");
      setShowCreate(false);
    } catch (err) {
      console.error("Failed to create forum:", err);
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (e: React.MouseEvent, forum: Forum) => {
    e.stopPropagation();
    setEditingForum(forum);
    setEditTitle(forum.title);
    setEditDesc(forum.description ?? "");
  };

  const handleEdit = async () => {
    if (!editingForum || !editTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/forums/${editingForum.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            description: editDesc.trim(),
          }),
        }
      );
      if (!res.ok) return;
      setForums((prev) =>
        prev.map((f) =>
          f.id === editingForum.id
            ? { ...f, title: editTitle.trim(), description: editDesc.trim() }
            : f
        )
      );
      setEditingForum(null);
    } catch (err) {
      console.error("Failed to edit forum:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/forums/${deletingId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (!res.ok) return;
      setForums((prev) => prev.filter((f) => f.id !== deletingId));
      setDeletingId(null);
    } catch (err) {
      console.error("Failed to delete forum:", err);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = forums.filter((f) => {
    if (!f || !f.id) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (f.title ?? "").toLowerCase().includes(q) ||
      (f.description ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="forum-page">
      <div className="forum-header">
        <div>
          <h1 className="forum-title">Forums</h1>
          <p className="forum-subtitle">Discuss music with the community</p>
        </div>
        <button
          className="btn-create-forum"
          onClick={() => setShowCreate(true)}
        >
          + New Forum
        </button>
      </div>

      <input
        className="forum-search"
        placeholder="Search forums…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create a Forum</h2>
            <input
              className="modal-input"
              placeholder="Forum title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea
              className="modal-textarea"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
            />
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button
                className="btn-submit"
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingForum && (
        <div className="modal-overlay" onClick={() => setEditingForum(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Edit Forum</h2>
            <input
              className="modal-input"
              placeholder="Forum title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <textarea
              className="modal-textarea"
              placeholder="Description (optional)"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
            />
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setEditingForum(null)}
              >
                Cancel
              </button>
              <button
                className="btn-submit"
                onClick={handleEdit}
                disabled={!editTitle.trim() || saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deletingId && (
        <div className="modal-overlay" onClick={() => setDeletingId(null)}>
          <div
            className="modal modal--compact"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">Delete Forum?</h2>
            <p className="modal-body-text">
              This will permanently delete the forum and all its posts. This
              cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setDeletingId(null)}
              >
                Cancel
              </button>
              <button
                className="btn-delete-confirm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="forum-skeleton-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="forum-skeleton-card">
              <div
                className="skeleton-box"
                style={{
                  height: "18px",
                  width: "40%",
                  animationDelay: `${i * 0.07}s`,
                }}
              />
              <div
                className="skeleton-box"
                style={{
                  height: "13px",
                  width: "65%",
                  marginTop: "8px",
                  animationDelay: `${i * 0.07}s`,
                }}
              />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="forum-empty">No forums found.</p>
      ) : (
        <div className="forum-list">
          {filtered.map((forum) => (
            <div
              key={forum.id}
              className="forum-card"
              onClick={() => navigate(`/forum/${forum.id}`)}
            >
              <div className="forum-card-body">
                <h2 className="forum-card-title">{forum.title}</h2>
                {forum.description && (
                  <p className="forum-card-desc">{forum.description}</p>
                )}
                {forum.creatorName && (
                  <p className="forum-card-creator">
                    Posted by{" "}
                    <span className="forum-card-creator-name">
                      {forum.creatorName}
                    </span>
                  </p>
                )}
              </div>
              <div className="forum-card-right">
                {forum.postCount !== undefined && (
                  <span className="forum-card-count">
                    {forum.postCount} {forum.postCount === 1 ? "post" : "posts"}
                  </span>
                )}
                {forum.createdBy === userId && (
                  <div className="forum-card-actions">
                    <button
                      className="btn-icon btn-icon--edit"
                      onClick={(e) => openEdit(e, forum)}
                      title="Edit forum"
                    >
                      ✎
                    </button>
                    <button
                      className="btn-icon btn-icon--delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(forum.id);
                      }}
                      title="Delete forum"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
