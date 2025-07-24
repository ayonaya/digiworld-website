// netlify/functions/get-firebase-config.js

// This function securely provides the public Firebase configuration
// keys to your frontend by reading them from environment variables.
exports.handler = async (event, context) => {
  try {
    // Ensure all required environment variables are set in your Netlify project
    if (!process.env.FIREBASE_API_KEY || !process.env.FIREBASE_AUTH_DOMAIN || !process.env.FIREBASE_PROJECT_ID) {
      throw new Error('Required Firebase configuration environment variables are not set.');
    }

    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firebaseConfig),
    };

  } catch (error) {
    console.error('Error fetching Firebase config:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Internal server error: Could not load app configuration.' })
    };
  }
};