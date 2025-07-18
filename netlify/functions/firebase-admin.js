// /netlify/functions/firebase-admin.js

const admin = require('firebase-admin');

try {
  if (!admin.apps.length) {
    // This will now work because netlify.toml ensures the file is included
    const serviceAccount = require('./digiworld-46a1e-firebase-adminsdk-fbsvc-5542dd28ef.json'); // Ensure filename is exact

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
}

module.exports = { db: admin.firestore() };