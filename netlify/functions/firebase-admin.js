// netlify/functions/firebase-admin.js

const admin = require('firebase-admin');

// This check prevents the app from being initialized multiple times,
// which can happen in a serverless environment.
if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountString) {
      throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    // This is the crucial fix: Environment variables often store newline
    // characters as a literal '\n' string. This line replaces those
    // with actual newline characters so the private key can be parsed correctly.
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

// Export the initialized firestore database instance.
module.exports = { db: admin.firestore() };
