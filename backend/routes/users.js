import express from 'express';
import db from '../firebaseAdmin.js';

const router = express.Router();

// get all public users
router.get('/', async (req, res) => {
    try {
        const usersRef = db.collection('users');
        const snapShot = await usersRef.where('isPrivate', '==', false).get();

        const usersList = [];
        snapShot.forEach(doc => {
            const data = doc.data();
            usersList.push({
                id: doc.id,
                username: data.username,
                color: '#1b3b5a', //temporary
                topArtist: { name: "Mystery Artist", imageUrl: "https://i.pravatar.cc/150" },
                topSong: { name: "Mystery Song", imageUrl: "https://i.pravatar.cc/150" }
            });
        });

        return res.status(200).json(usersList);
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json( {message: 'Could not fetch users' });
    }
});

export default router;