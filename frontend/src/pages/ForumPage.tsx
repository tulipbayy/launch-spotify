import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ForumPage.css";

export default function ForumPage() {
  const [forums, setForums] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [newForumName, setNewForumName] = useState("");
  const [newForumDesc, setNewForumDesc] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    const fetchForums = async () => {
      const response = await fetch("http://127.0.0.1:5001/api/forums");
      const data = await response.json();
      setForums(data);
      setLoading(false);
    };
    fetchForums();
  }, []);

  const createForum = async () => {
    if (!newForumName.trim()) return;
    const response = await fetch("http://127.0.0.1:5001/api/forums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newForumName,
        description: newForumDesc,
        createdBy: userId,
      }),
    });
    const newForum = await response.json();
    setForums([...forums, newForum]);
    setNewForumName("");
    setNewForumDesc("");
    setShowForm(false);
  };

  const filteredForums = forums.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="forum-page">
      <div className="forum-container">
        <div className="forum-header">
          <h1 className="forum-title">Forums</h1>
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            + New Forum
          </button>
        </div>

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
  );
}
