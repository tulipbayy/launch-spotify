import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DiscoverPage.css';

interface User {
  id: string;
  displayName: string;
  bio: string;
  pfp: string;
  color: string;
  joinDate: string;
  topArtist: {
    name: string;
    imageUrl: string;
  };
  topSong: {
    name: string;
    imageUrl: string;
  };
}

export default function DiscoverPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sortOrder, setSortOrder] = useState<string>('newest');

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('http://localhost:5001/users');
        const realData = await response.json();
        const BRAND_COLORS = ["#1b3b5a", "#fbbd5c", "#da3b3a", "#f17f16", "#8fa0a8"];
        const usersWithColors = realData.map((u: User, index: number) => {
          return {
            ...u,
            color: BRAND_COLORS[index % BRAND_COLORS.length]
          };
        });

        setUsers(usersWithColors);
      } catch (error) {
        console.error("failed to get users: ", error);
      }
    }

    fetchUsers();
  }, []);

  if (users.length === 0) {
    return <div className="discover-container">
        <h2>Loading users...</h2>
      </div>;
  }

  const featuredUser = users[0];
  const moreUsers = users.slice(1);

  const sortedMoreUsers = [...moreUsers].sort((a, b) => {
    const dateA = new Date(a.joinDate).getTime();
    const dateB = new Date(b.joinDate).getTime();

    if (sortOrder === 'newest') {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  })

  return (
    <div className="discover-container">
      <h2>Discover users</h2>
      
      <div className="featured-section">
        <div
          className="featured-avatar-block clickable"
          style={{ backgroundColor: featuredUser.color }}
          onClick={() => setSelectedUser(featuredUser)}
          >
            <div className="avatar-circle"></div>
          </div>

          <div className="featured-info">
            <h3>Your Top User</h3>
            <p className="username-text">{featuredUser.displayName}</p>
            <div className="action-buttons">
              <button onClick={() => navigate(`/inbox?userId=${featuredUser.id}`)}>✉️ Message</button>
            </div>
          </div>
      </div>

      <hr className="divider" />

      <div className="more-users-section">
        <div className="more-users-header">
          <h3>More Users</h3>
           <select 
            className="filter-dropdown"
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Filter By: Newest</option>
            <option value="oldest">Filter By: Oldest</option>
          </select>
        </div>

        <div className="users-grid">
          {sortedMoreUsers.map((user) => (
            <div key={user.id} className="small-user-card">
              <div
                className="small-avatar-block clickable"
                style={{ backgroundColor: user.color }}
                onClick={() => setSelectedUser(user)}
                >
                  <div className="avatar-circle"></div>
              </div>

              <p className="username-text">{user.displayName}</p>

              <div className="action-buttons small">
                <button>✉️ Message</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedUser(null)}>⊗</button>
            
            <div className="modal-header">
              <div className="modal-avatar"></div>
              <div className="modal-title">
                <h2>{selectedUser.displayName}</h2>
                <p>Profile Created: {new Date(selectedUser.joinDate).toLocaleString('default', { month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-music">
                <div className="music-item">
                  <span className="music-label">Top Artist</span>
                  <img src={selectedUser.topArtist.imageUrl} alt={selectedUser.topArtist.name} />
                  <p>{selectedUser.topArtist.name}</p>
                </div>

                <div className="music-item">
                  <span className="music-label">Top Song</span>
                  <img src={selectedUser.topSong.imageUrl} alt={selectedUser.topSong.name} />
                  <p>{selectedUser.topSong.name}</p>
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={() => navigate(`/profile?userId=${selectedUser.id}`)}>👤 View Profile</button>
                <button onClick={() => navigate(`/inbox?userId=${selectedUser.id}`)}>✉️ Message</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
