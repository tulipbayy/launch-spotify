import { useState, useEffect } from 'react';
import '../styles/DiscoverPage.css';

interface User {
  id: string;
  username: string;
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

// const MOCK_USERS: User[] = [
//   { 
//     id: "1", 
//     username: "hugeDrakeFan123", 
//     color: "#1b3b5a", 
//     joinDate: "May 2026",
//     topArtist: { name: "Drake", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9" },
//     topSong: { name: "Janice ST*U", imageUrl: "https://i.scdn.co/image/ab67616d0000b2734f19b8bd4f31c238b97561f2" }
//   },
//   { 
//     id: "2", 
//     username: "user123", 
//     color: "#fbbd5c", 
//     joinDate: "Jan 2026",
//     topArtist: { name: "Taylor Swift", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3132a15fbb0" },
//     topSong: { name: "Anti-Hero", imageUrl: "https://i.scdn.co/image/ab67616d0000b273bb54dde15cdb199d631ffdb0" }
//   },
//   { 
//     id: "3", 
//     username: "user097", 
//     color: "#da3b3a", 
//     joinDate: "Mar 2026",
//     topArtist: { name: "Skrillex", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb98f8287661b16c141029c7d4" },
//     topSong: { name: "Rumble", imageUrl: "https://i.scdn.co/image/ab67616d0000b273b40097f4fbd13532f83196ed" }
//   },
//   { 
//     id: "4", 
//     username: "user675", 
//     color: "#f17f16", 
//     joinDate: "Feb 2026",
//     topArtist: { name: "Miles Davis", imageUrl: "https://i.scdn.co/image/ab6761610000e5ebeb94156b85d33a90ad11f9d5" },
//     topSong: { name: "So What", imageUrl: "https://i.scdn.co/image/ab67616d0000b27318ff2ea34ddbe95904deedee" }
//   },
//   { 
//     id: "5", 
//     username: "user456", 
//     color: "#1b3b5a", 
//     joinDate: "Apr 2026",
//     topArtist: { name: "The Weeknd", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb" },
//     topSong: { name: "Blinding Lights", imageUrl: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36" }
//   },
// ];

export default function DiscoverPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sortOrder, setSortOrder] = useState<string>('newest');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('http://127.0.0.1:5000/users');
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
            <p className="username-text">{featuredUser.username}</p>
            <div className="action-buttons">
              <button>✉️ Message</button>
              <button className="add-btn">⊕ Add User</button>
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

              <p className="username-text">{user.username}</p>

              <div className="action-buttons small">
                <button>✉️ Message</button>
                <button className="add-btn">⊕ Add User</button>
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
                <h2>{selectedUser.username}</h2>
                <p>Profile Created: {selectedUser.joinDate}</p>
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
                <button>👤 View Profile</button>
                <button>✉️ Message</button>
                <button className="add-btn">⊕ Add User</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
