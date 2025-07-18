// File: import-products.js

// 1. Import necessary modules
const admin = require('firebase-admin');
// ✨ FIX: We now correctly pull the 'products' array from the required file
const { products: productsData } = require('./netlify/functions/_data/products-data.js');

// 2. !!! IMPORTANT !!!
// REPLACE 'YOUR_SERVICE_ACCOUNT_KEY_FILE.json' WITH THE ACTUAL FILENAME YOU DOWNLOADED
const serviceAccount = require('./digiworld-46a1e-firebase-adminsdk-fbsvc-5542dd28ef.json');

// 3. Initialize the Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1); // Exit if initialization fails
}

// 4. Get a reference to the Firestore database
const db = admin.firestore();
const productsCollection = db.collection('products');

// 5. The main function to import the data
async function importProducts() {
  // The rest of the code is now correct because 'productsData' is the array
  console.log(`Starting import of ${productsData.length} products...`);

  const batch = db.batch();

  productsData.forEach((product) => {
    const docRef = productsCollection.doc(product.id);
    batch.set(docRef, product);
    console.log(`- Staging product for import: ${product.name.en}`);
  });

  try {
    await batch.commit();
    console.log('\n✅ All products have been successfully imported to Firestore!');
  } catch (error) {
    console.error('\n❌ Error committing batch:', error);
  }
}

// 6. Run the import function
importProducts().catch(error => {
    console.error("An unexpected error occurred:", error);
});