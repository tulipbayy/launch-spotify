const express = require('express');
const db = require('../firebaseAdmin.js');

const router = express.Router();

// get all public users
router.get('/', async (req, res) => {
    try {
        const usersRef = db.collection('profiles');
        // const snapshot = await usersRef.where('isPublic', '==', false).get();
        const snapshot = await usersRef.get();

        const usersPromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            
            // for dates
            const rawDate = data.createdAt || data.dateCreated || new Date().toISOString();
            // because Firebase has its own weird timestamp
            const finalJoinDate = typeof rawDate.toDate === 'function' 
                ? rawDate.toDate().toISOString() 
                : rawDate;
            
            // fetch artist data
            const topArtistId = (data.displayedArtistIds && data.displayedArtistIds.length > 0) 
                ? data.displayedArtistIds[0] : 'default_artist_id';

            const artistDoc = await db.collection('artists').doc(topArtistId).get();
            const artistData = artistDoc.exists ? artistDoc.data() : {};

            // fetch song data
            const topSongId = (data.displayedSongIds && data.displayedSongIds.length > 0) 
                ? data.displayedSongIds[0] : 'default_song_id';
                
            const songDoc = await db.collection('songs').doc(topSongId).get();
            const songData = songDoc.exists ? songDoc.data() : {};
            
            return {
                id: doc.id,
                displayName: data.displayName || 'Unknown User',
                bio: data.bio || '',
                pfp: data.pfp || '',
                joinDate: finalJoinDate,
                
                topArtist: { 
                    name: artistData.name || "Drake", 
                    imageUrl: artistData.picture || "https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9" 
                },
                topSong: { 
                    name: songData.title || "Janice S**U", 
                    imageUrl: songData.picture || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTljq0VODGLfbBRkSP9o8d9jIjROYEZcKnIpQ&s" 
                }
            };
        });
        // 2. Wait for all the database lookups to finish
        const usersList = await Promise.all(usersPromises);
        // 3. Send the fully loaded users to React!
        return res.status(200).json(usersList);
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json( {message: 'Could not fetch users' });
    }
});

module.exports = router;