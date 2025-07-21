// File: netlify/functions/firebase-config.js

const admin = require('firebase-admin');

// **FIXED:** Using your existing Netlify key name.
// Note: We use brackets [] because your key name has spaces.
const serviceAccount = JSON.parse(Buffer.from(process.env['FIREBASE_SERVICE_ACCOUNT_KEY'], 'base64').toString('ascii'));

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Export the initialized Firestore instance
const db = admin.firestore();
module.exports = { db };