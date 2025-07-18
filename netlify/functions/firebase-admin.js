// /netlify/functions/firebase-admin.js

const admin = require('firebase-admin');

// IMPORTANT: Replace this with the actual name of your service account key file
const SERVICE_ACCOUNT_FILE = './digiworld-46a1e-firebase-adminsdk-fbsvc-5542dd28ef.json'; 

try {
  // Check if the app is already initialized to prevent errors
  if (!admin.apps.length) {
    // Import the service account key from the local file
    const serviceAccount = require(SERVICE_ACCOUNT_FILE);

    // Initialize the Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('Firebase admin initialization error:', error);
}

// Export the initialized database instance
module.exports = { db: admin.firestore() };