// File: netlify/functions/firebase-config.js

const admin = require('firebase-admin');

// **FIXED:** Using the exact key name you provided.
const secretKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!secretKey) {
  throw new Error('Firebase secret key is not set. Go to Netlify > Site settings > Build & deploy > Environment and ensure FIREBASE_SERVICE_ACCOUNT_KEY is correct.');
}

let serviceAccount;
try {
  // This part decodes the key. It still requires the value in Netlify to be Base64 encoded.
  const decodedKey = Buffer.from(secretKey, 'base64').toString('ascii');
  serviceAccount = JSON.parse(decodedKey);
} catch (e) {
  console.error("Critical Error: Failed to parse the Firebase secret key. Ensure the value in Netlify is the complete, Base64-encoded JSON from your service account file.");
  throw new Error('Failed to parse Firebase secret key.');
}

// Initialize Firebase Admin SDK only if it hasn't been already
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (e) {
    throw new Error(`Firebase initialization failed: ${e.message}`);
  }
}

// Export the initialized Firestore instance for other functions to use
module.exports = { db: admin.firestore() };