// /netlify/functions/firebase-admin.js

const admin = require('firebase-admin');

try {
  if (!admin.apps.length) {
    // Get the specially formatted JSON from the environment variable
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountString) {
      throw new Error('Firebase service account key is not set in environment variables.');
    }

    // Parse the JSON string into an object
    const serviceAccount = JSON.parse(serviceAccountString);

    // Initialize the SDK with the parsed credentials
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
}

module.exports = { db: admin.firestore() };