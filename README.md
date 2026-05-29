# SpotSocial

## Project Description

SpotSocial is a full-stack social music web application built using React, Express, Firebase, and Spotify API. The app is designed to extend the Spotify listening experience by allowing users to share and view other user’s music interests and connect through messaging and discussion forums.

Users can:

- View their top artists and songs
- Browse their liked songs
- Customize a public or private profile
- Discover other users
- Participate in music discussion forums
- Send direct messages to other users

## Table of Contents
1. Running the Project
2. Tech Stack
3. Project Structure
4. Features & Status
5. Future Improvements
6. Credits

## Running the project

### Installation

#### Clone the repository
git clone <repository-url> 

cd launch-spotify

#### Install Frontend Dependencies
cd frontend 

npm install

#### Install Backend Dependencies
cd backend

npm install

### External Setup
#### Spotify Developer Setup

Go to the Spotify Developer Dashboard

Create a new application

Add a redirect URI

##### Copy your:

Client ID

Client Secret

### Environment variables
Create a .env file inside the backend folder.

#### Example:

SPOTIFY_CLIENT_ID=your_client_id

SPOTIFY_CLIENT_SECRET=your_client_secret

SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/auth/callback

PORT=5000

### Running locally
#### Start backend:

cd backend

npm start

#### Backend runs on:

http://localhost:5000

#### Start frontend:

cd frontend

npm run dev

#### Frontend runs on:

http://localhost:5173

## Tech Stack

### Frontend
- React.js
- Vite
- Mantine UI

### Backend
Express.js

### Database
Google Firestore

### APIs
Spotify Web API

### Other tools
React Router

axios

cors

dotenv

cookie-parser

## Project Structure

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── components/       # Reusable UI components (Layout, Navbar, etc.)
│   ├── contexts/         # React Contexts (e.g., AuthContext for global state)
│   ├── pages/            # Main route views
│   │   ├── DiscoverPage.tsx  # Global user discovery grid
│   │   ├── ProfilePage.tsx   # User profile and Spotify stats
│   │   ├── InboxPage.tsx     # Direct messaging interface
│   │   └── ForumPage.tsx     # Community music discussions
│   ├── App.tsx           # React Router implementation
│   └── main.tsx          # Application entry point & Provider wrapping
├── package.json
└── vite.config.ts        # Vite configuration and backend API proxying
```
### Backend (`/backend`)
```
backend/
├── config/               # Environment variables and configuration (env.js)
├── controllers/          # Route logic and request handling 
│   ├── authController.js       # Spotify OAuth flow
│   └── discoverController.js   # User fetching and catalog hydration
├── middleware/           # Express middleware (Auth protection, Error handling)
├── routes/               # API route definitions
│   ├── authRoutes.js     
│   └── users.js          
├── services/             # External API wrappers
│   ├── spotifyApiService.js    # Spotify Web API calls
│   └── userService.js          # Firebase database operations
├── app.js                # Express app initialization and server entry point
├── firebaseAdmin.js      # Firebase Admin SDK configuration
└── package.json
```
## Features & Status
- Authentication
  - Spotify OAuth login
  - User session management
  - User Profile
- Edit profile information
  - Public/private profile toggle
  - Display top songs and artists
- Top Artists Page
  - View top artists
  - Filter by:
  - All Time
  - Last 6 Months
  - Last Month
- Top Songs Page
  - View top songs
  - Filter by:
  - All Time
  - Last 6 Months
  - Last Month
  - Liked Songs Page
- View Spotify liked songs
  - Display album artwork
  - Ability to view song and redirect to spotify
- Discover Page
  - Browse public profiles
  - View user music preferences
- Messaging System
  - Send direct messages
  - View inbox conversations
- Forum system
  - Create discussion boards
  - Search forums by name
  - Create posts
  - Like posts
  - Tag songs in replies to forum posts
  - Ability to reply to other comments

## Future Improvements
### Accessibility improvements
Continue improving accessibility by adding stronger keyboard navigation support, screen reader compatibility, higher color contrast options, and responsive layouts to make the platform more inclusive and user-friendly for all users.

### Group chats
Expand the messaging system to support group conversations so users can discuss artists, albums, or genres together in real time and build stronger music communities.

### Collaborative playlists
Allow users to create and share playlists with friends, making the platform more interactive and encouraging collaborative music discovery.

### Personalized Welcome page
Create a dynamic homepage that greets users with recommended artists, trending forums, recent activity, and quick access to their favorite features.

## Credits
Developed by:

Bayansulu Tulepbayeva

Sanaa Elattari

Jun Hong

Ryan Taylor

Ethan Cheung
