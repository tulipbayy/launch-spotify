const admin = require('firebase-admin');
require('dotenv').config();
const requiredEnv = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
]

const missingEnv = requiredEnv.filter((key) => !process.env[key])
if (missingEnv.length) {
  throw new Error(
    `Missing Firebase admin environment variables: ${missingEnv.join(', ')}. ` +
      'Create a backend/.env file or set these variables before starting the server.'
  )
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const db = admin.firestore();

module.exports = db;