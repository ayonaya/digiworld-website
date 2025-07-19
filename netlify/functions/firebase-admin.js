// netlify/functions/firebase-admin.js

const admin = require('firebase-admin');

// This check prevents the app from being initialized multiple times,
// which can happen in a serverless environment.
if (!admin.apps.length) {
  try {
    // ✨ FIX: Using the correct environment variable name that we set in Netlify.
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountString) {
      throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please check your Netlify site settings.');
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    // This line correctly formats the private key from the environment variable.
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('CRITICAL: Firebase admin initialization failed.', error);
  }
}

// Export the initialized firestore database instance for other functions to use.
module.exports = { db: admin.firestore() };
