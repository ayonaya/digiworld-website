// /netlify/functions/firebase-admin.js

const admin = require('firebase-admin');

try {
  if (!admin.apps.length) {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountString) {
      throw new Error('Firebase service account key is not set in environment variables.');
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    // This line correctly formats the private key's newline characters.
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
}

module.exports = { db: admin.firestore() };