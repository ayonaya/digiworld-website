// /netlify/functions/firebase-admin.js

const admin = require('firebase-admin');
const path = require('path'); // We will use this to create a reliable path

// --- IMPORTANT ---
// Make sure this filename exactly matches your service account key file!
const SERVICE_ACCOUNT_FILENAME = 'digiworld-46a1e-firebase-adminsdk-fbsvc-5542dd28ef.json'; 
// ---

try {
  // Check if the app is already initialized to prevent errors
  if (!admin.apps.length) {
    // This creates a reliable, absolute path to your key file
    const serviceAccountPath = path.join(__dirname, SERVICE_ACCOUNT_FILENAME);
    const serviceAccount = require(serviceAccountPath);

    // Initialize the Firebase Admin SDK with the key from the file
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('Firebase admin initialization error:', error);
}

// Export the initialized database instance
module.exports = { db: admin.firestore() };