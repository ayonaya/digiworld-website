/*
  This secure Netlify function's only job is to provide your
  public Firebase configuration keys to your frontend website.
  It reads the keys from the secure environment variables you
  have set in your Netlify project settings.
*/
exports.handler = async () => {
  // Check to ensure all required environment variables are set.
  const requiredKeys = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
    'FIREBASE_MEASUREMENT_ID',
  ];

  const missingKeys = requiredKeys.filter(key => !process.env[key]);

  if (missingKeys.length > 0) {
    console.error(`Configuration Error: The following environment variables are missing in your Netlify settings: ${missingKeys.join(', ')}`);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Server configuration error. Could not load required application keys.'
      }),
    };
  }

  // If all keys are present, return them to the frontend.
  return {
    statusCode: 200,
    body: JSON.stringify({
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    }),
  };
};