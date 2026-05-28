import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useContext } from "react";
import { AuthContext } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LikedSongsPage from "./pages/LikedSongsPage";
import TopArtistsPage from "./pages/TopArtistsPage";
import TopSongsPage from "./pages/TopSongsPage";
import ProfilePage from "./pages/ProfilePage";
import DiscoverPage from "./pages/DiscoverPage";
import InboxPage from "./pages/InboxPage";
import ForumPage from "./pages/ForumPage";
import ForumDetailPage from "./pages/ForumDetailPage";


// Temporary just to test auth
function SpotifyCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { login } = useContext(AuthContext);

  useEffect(() => {
    const encodedUser = searchParams.get('user');
    if (encodedUser) {
      // Decode the Base64 string back into a normal JSON string
      const decodedString = atob(encodedUser);
      // Parse it into a Javascript object
      const userData = JSON.parse(decodedString);

      login(userData);
      
      console.log("Logged in as:", userData);
      alert(`Welcome, ${userData.username}!`);
      
      // Send them to the home page now that we have their data
      navigate('/'); 
    }
  }, [searchParams, navigate, login]);
  
  return <div>Logging you in...</div>;
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("accessToken");
  const userId = params.get("userId");
  if (token) sessionStorage.setItem("accessToken", token);
  if (userId) sessionStorage.setItem("userId", userId);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/spotify/callback" element={<SpotifyCallback />} /> {/*temporary*/}
          <Route path="/" element={<HomePage />} />
          <Route path="/liked" element={<LikedSongsPage />} />
          <Route path="/top-artists" element={<TopArtistsPage />} />
          <Route path="/top-songs" element={<TopSongsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/:id" element={<ForumDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
