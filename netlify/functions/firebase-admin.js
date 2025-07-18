// /netlify/functions/firebase-admin.js

const admin = require('firebase-admin');

try {
  // Check if the app is already initialized to prevent errors
  if (!admin.apps.length) {
    // This will now work because netlify.toml ensures the file is included.
    const serviceAccount = require('./digiworld-46a1e-firebase-adminsdk-fbsvc-0bde804ae9.json');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
}

// Export the initialized database instance for use in other functions
module.exports = { db: admin.firestore() };