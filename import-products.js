// import-products.js

const admin = require('firebase-admin');
const products = require('./public/products').products; // Assuming products are exported from public/products.js

// This path assumes your service account key is in a 'config' folder
// at the root of your project, with the exact filename you uploaded.
const serviceAccount = require('./config/digiworld-46a1e-firebase-adminsdk-fbsvc-0bde804ae9.json');

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('Firebase admin initialization failed.', error);
  process.exit(1); // Exit if initialization fails
}

const db = admin.firestore();

async function importProducts() {
  console.log('Starting product import...');
  if (!products || products.length === 0) {
    console.log('No products found to import.');
    return;
  }

  const productsCollection = db.collection('products');
  let importedCount = 0;

  for (const product of products) {
    try {
      // Use the product ID as the document ID in Firestore for easier retrieval
      await productsCollection.doc(product.id).set(product); // This line was missing in your pasted code, adding it back.
      console.log(`Imported product: ${product.name.en} (ID: ${product.id})`);
      importedCount++;
    } catch (error) {
      console.error(`Error importing product ${product.id}:`, error);
    }
  }
  console.log(`Product import finished. Total imported: ${importedCount}`);
}

importProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error during import:', error);
    process.exit(1);
  });