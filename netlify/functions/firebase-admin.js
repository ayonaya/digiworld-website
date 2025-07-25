const admin = require('firebase-admin');

// This check prevents the app from being initialized multiple times,
// which is a best practice in serverless environments.
if (admin.apps.length === 0) {
  try {
    // Using the exact environment variable name you have set in Netlify.
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountString) {
      throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please check your Netlify site settings.');
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

  } catch (error) {
    console.error('CRITICAL: Firebase admin initialization failed.', error);
  }
}

// Export the initialized firestore database instance for other functions to use.
module.exports = { db: admin.firestore(), admin: admin };