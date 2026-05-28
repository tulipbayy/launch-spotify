const admin = require('firebase-admin');
require('dotenv').config();

const requiredEnv = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];

// Under CI (no service-account secrets), export a stub so module imports resolve
// for build/lint smoke tests without initializing Firebase.
if (process.env.CI === 'true' && !process.env.FIREBASE_PRIVATE_KEY) {
  module.exports = new Proxy(
    {},
    {
      get() {
        throw new Error('Firestore is unavailable in CI (no service-account credentials).');
      },
    }
  );
} else {
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  if (missingEnv.length) {
    throw new Error(
      `Missing Firebase admin environment variables: ${missingEnv.join(', ')}. ` +
        'Create a backend/.env file or set these variables before starting the server.'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });

  module.exports = admin.firestore();
}
