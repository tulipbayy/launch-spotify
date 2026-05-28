// Inserts sample data matching schema.txt for local testing.
// Run: node seed.js   (requires real Firebase admin env in backend/.env)
// Note: seeded users have placeholder/expired tokens — they exist so Discover,
// Forums, and Inbox have something to show. Real login still goes through OAuth.
const admin = require('firebase-admin');
const db = require('./firebaseAdmin');

const now = admin.firestore.FieldValue.serverTimestamp();

// Real-ish Spotify IDs so displayed* hydration could work if you swap them.
const USERS = [
  {
    spotifyId: 'seed-alice',
    displayName: 'Alice',
    bio: 'Indie pop enthusiast. Always hunting for the next favorite track.',
    email: 'alice@example.com',
    pfp: null,
    isPrivate: false,
    displayedArtistIds: [],
    displayedSongIds: [],
  },
  {
    spotifyId: 'seed-bob',
    displayName: 'Bob',
    bio: 'Lo-fi beats to study to.',
    email: 'bob@example.com',
    pfp: null,
    isPrivate: false,
    displayedArtistIds: [],
    displayedSongIds: [],
  },
  {
    spotifyId: 'seed-carol',
    displayName: 'Carol',
    bio: 'Private listener.',
    email: 'carol@example.com',
    pfp: null,
    isPrivate: true,
    displayedArtistIds: [],
    displayedSongIds: [],
  },
];

const FORUMS = [
  { name: 'Indie Discoveries', description: 'Share hidden gems.', createdBy: 'seed-alice', createdByName: 'Alice' },
  { name: 'Production Talk', description: 'Mixing, mastering, gear.', createdBy: 'seed-bob', createdByName: 'Bob' },
];

async function seed() {
  console.log('Seeding users...');
  for (const u of USERS) {
    await db.collection('users').doc(u.spotifyId).set(
      {
        ...u,
        // Placeholder tokens (expired) — seeded users can't call Spotify.
        accessToken: '',
        refreshToken: '',
        tokenExpiresAt: 0,
        scope: '',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      },
      { merge: true }
    );
  }

  console.log('Seeding forums + posts...');
  for (const f of FORUMS) {
    const ref = await db.collection('forums').add({
      name: f.name,
      nameLower: f.name.toLowerCase(),
      description: f.description,
      createdBy: f.createdBy,
      createdByName: f.createdByName,
      postCount: 2,
      createdAt: now,
    });
    const posts = [
      { authorId: 'seed-alice', authorName: 'Alice', content: `First post in ${f.name}!`, likedBy: ['seed-bob'], likes: 1 },
      { authorId: 'seed-bob', authorName: 'Bob', content: 'Great thread, following.', likedBy: [], likes: 0 },
    ];
    for (const p of posts) {
      await ref.collection('posts').add({ forumId: ref.id, ...p, createdAt: now });
    }
  }

  console.log('Seeding a conversation + messages...');
  const ids = ['seed-alice', 'seed-bob'].sort();
  const convId = ids.join('__');
  await db.collection('conversations').doc(convId).set({
    participantIds: ids,
    participantNames: { 'seed-alice': 'Alice', 'seed-bob': 'Bob' },
    lastMessage: 'See you at the show!',
    lastMessageAt: now,
    lastSenderId: 'seed-bob',
  });
  const msgs = [
    { senderId: 'seed-alice', text: 'Have you heard the new release?' },
    { senderId: 'seed-bob', text: 'Yes! On repeat. See you at the show!' },
  ];
  for (const m of msgs) {
    await db.collection('conversations').doc(convId).collection('messages').add({ ...m, timestamp: now });
  }

  console.log('Done seeding.');
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  });
