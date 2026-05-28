import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LikedSongsPage from './pages/LikedSongsPage'
import TopArtistsPage from './pages/TopArtistsPage'
import TopSongsPage from './pages/TopSongsPage'
import ProfilePage from './pages/ProfilePage'
import DiscoverPage from './pages/DiscoverPage'
import InboxPage from './pages/InboxPage'
import ForumPage from './pages/ForumPage'
import ForumDetailPage from './pages/ForumDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
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
  )
}
