/*
  This script is for local development use only.
  It seeds your Firestore database with product data from seed-data.json.
*/
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// --- Load Environment Variables from .env.local ---
// This line explicitly tells the script to find and load your .env.local file.
dotenv.config({ path: path.resolve(__dirname, '.env.local') });


// --- Firebase Admin Initialization ---
try {
  // This line now reads the variable loaded from your .env.local file.
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountString) {
    throw new Error('CRITICAL: The FIREBASE_SERVICE_ACCOUNT_KEY was not found in your .env.local file.');
  }

  const serviceAccount = JSON.parse(serviceAccountString);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

} catch (error) {
  console.error('Firebase Admin Initialization Error:', error.message);
  process.exit(1); // Exit the script if initialization fails
}

const db = admin.firestore();
const productsDataPath = path.join(__dirname, 'seed-data.json');

async function uploadProducts() {
  try {
    const productsRaw = fs.readFileSync(productsDataPath, 'utf8');
    const products = JSON.parse(productsRaw);

    if (!products || products.length === 0) {
      console.log('No products found in seed-data.json. Exiting.');
      return;
    }

    console.log(`Found ${products.length} products. Starting upload...`);

    const batch = db.batch();

    products.forEach(product => {
      const docRef = db.collection('products').doc(product.id);
      batch.set(docRef, product);
    });

    await batch.commit();

    console.log('✅ Success! All products have been uploaded to Firestore.');

  } catch (error) {
    console.error('❌ Error uploading products:', error);
    process.exit(1);
  }
}

uploadProducts();