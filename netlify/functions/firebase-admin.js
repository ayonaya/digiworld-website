// netlify/functions/firebase-admin.js

const admin = require('firebase-admin');

try {
  // Check if the app is already initialized to prevent multiple initializations
  if (!admin.apps.length) {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountString) {
      throw new Error('Firebase service account key is not set in environment variables.');
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    // ✨ CORRECTED FIX: This line now correctly formats the private key's newline characters. ✨
    // It replaces literal '\n' sequences (common from environment variables) with actual newlines.
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n'); //

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
  // Depending on your error handling, you might want to re-throw or handle more gracefully.
  // For Netlify Functions, this error will be caught by the platform.
}

module.exports = { db: admin.firestore() };