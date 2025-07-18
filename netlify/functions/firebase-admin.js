// /netlify/functions/firebase-admin.js

const admin = require('firebase-admin');

try {
  // Check if the app is already initialized to prevent errors
  if (!admin.apps.length) {
    // Get the specially formatted JSON string from the environment variable
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountString) {
      throw new Error('Firebase service account key is not set in environment variables.');
    }

    // Parse the JSON string into a usable object
    const serviceAccount = JSON.parse(serviceAccountString);

    // Initialize the SDK with the credentials
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
}

// Export the initialized database instance for use in other functions
module.exports = { db: admin.firestore() };