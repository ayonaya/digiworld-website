// /netlify/functions/firebase-admin.js

const admin = require('firebase-admin');
const path = require('path');

try {
  if (!admin.apps.length) {
    // This looks for the key file in the function's root directory,
    // which is where Netlify will place it with our new config.
    const serviceAccountPath = path.resolve(process.cwd(), 'digiworld-46a1e-firebase-adminsdk-fbsvc-5542dd28ef.json');
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
}

module.exports = { db: admin.firestore() };